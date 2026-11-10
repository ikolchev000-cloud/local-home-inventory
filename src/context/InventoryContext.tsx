import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createEmptyState } from '@/data/catalog';
import type {
  EventType,
  InventoryEvent,
  InventoryState,
  ProductInput,
  ShoppingItem,
} from '@/types/inventory';

const STORAGE_KEY = '@polka/inventory-v2';

type ShoppingInput = Omit<ShoppingItem, 'id' | 'checked' | 'createdAt'>;

interface InventoryContextValue extends InventoryState {
  isHydrated: boolean;
  toast: string | null;
  addProduct: (input: ProductInput) => string;
  updateProduct: (id: string, input: ProductInput) => void;
  adjustQuantity: (id: string, amount: number, type: EventType) => void;
  deleteProduct: (id: string) => void;
  addShoppingItem: (input: ShoppingInput) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearPurchased: () => void;
  movePurchasedToInventory: () => void;
  showToast: (message: string) => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>({ products: [], events: [], shopping: [] });
  const [isHydrated, setIsHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (active) {
          if (saved) {
            const parsed = JSON.parse(saved) as InventoryState;
            setState({
              products: Array.isArray(parsed.products) ? parsed.products : [],
              events: Array.isArray(parsed.events) ? parsed.events : [],
              shopping: Array.isArray(parsed.shopping) ? parsed.shopping : [],
            });
          } else {
            setState(createEmptyState());
          }
        }
      } catch {
        if (active) setState(createEmptyState());
      } finally {
        if (active) setIsHydrated(true);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isHydrated) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [isHydrated, state]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const addProduct = useCallback((input: ProductInput) => {
    const id = makeId('product');
    const now = new Date().toISOString();
    const event: InventoryEvent = {
      id: makeId('event'),
      productId: id,
      productName: input.name,
      category: input.category,
      type: 'added',
      quantity: input.quantity,
      unit: input.unit,
      value: (input.price ?? 0) * input.quantity,
      date: now.slice(0, 10),
    };
    setState((current) => ({
      ...current,
      products: [...current.products, { ...input, id, createdAt: now, updatedAt: now }],
      events: [...current.events, event],
    }));
    return id;
  }, []);

  const updateProduct = useCallback((id: string, input: ProductInput) => {
    setState((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === id ? { ...input, id, createdAt: product.createdAt, updatedAt: new Date().toISOString() } : product,
      ),
    }));
  }, []);

  const adjustQuantity = useCallback((id: string, amount: number, type: EventType) => {
    setState((current) => {
      const product = current.products.find((item) => item.id === id);
      if (!product || amount <= 0) return current;
      const quantity = type === 'added'
        ? product.quantity + amount
        : Math.max(0, product.quantity - amount);
      const actualAmount = Math.abs(quantity - product.quantity);
      if (actualAmount === 0) return current;
      const event: InventoryEvent = {
        id: makeId('event'),
        productId: id,
        productName: product.name,
        category: product.category,
        type,
        quantity: actualAmount,
        unit: product.unit,
        value: (product.price ?? 0) * actualAmount,
        date: new Date().toISOString().slice(0, 10),
      };
      return {
        ...current,
        products: current.products.map((item) =>
          item.id === id ? { ...item, quantity, updatedAt: new Date().toISOString() } : item,
        ),
        events: [...current.events, event],
      };
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== id),
    }));
  }, []);

  const addShoppingItem = useCallback((input: ShoppingInput) => {
    setState((current) => ({
      ...current,
      shopping: [
        { ...input, id: makeId('shopping'), checked: false, createdAt: new Date().toISOString() },
        ...current.shopping,
      ],
    }));
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      shopping: current.shopping.map((item) => item.id === id ? { ...item, checked: !item.checked } : item),
    }));
  }, []);

  const removeShoppingItem = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      shopping: current.shopping.filter((item) => item.id !== id),
    }));
  }, []);

  const clearPurchased = useCallback(() => {
    setState((current) => ({ ...current, shopping: current.shopping.filter((item) => !item.checked) }));
  }, []);

  const movePurchasedToInventory = useCallback(() => {
    const purchased = state.shopping.filter((item) =>
      item.checked && item.productId && state.products.some((product) => product.id === item.productId),
    );
    if (!purchased.length) {
      showToast('Отметьте купленные продукты из запасов');
      return;
    }
    setState((current) => {
      const purchasedIds = new Set(purchased.map((item) => item.id));
      const additions = new Map(purchased.map((item) => [item.productId, item]));
      const newEvents = purchased.flatMap((item): InventoryEvent[] => {
        const product = current.products.find((candidate) => candidate.id === item.productId);
        if (!product) return [];
        return [{
          id: makeId('event'),
          productId: product.id,
          productName: product.name,
          category: product.category,
          type: 'added',
          quantity: item.quantity,
          unit: item.unit,
          value: (product.price ?? 0) * item.quantity,
          date: new Date().toISOString().slice(0, 10),
        }];
      });
      return {
        ...current,
        products: current.products.map((product) => {
          const addition = additions.get(product.id);
          return addition
            ? { ...product, quantity: product.quantity + addition.quantity, updatedAt: new Date().toISOString() }
            : product;
        }),
        events: [...current.events, ...newEvents],
        shopping: current.shopping.filter((item) => !purchasedIds.has(item.id)),
      };
    });
    showToast(`Добавлено в запасы: ${purchased.length}`);
  }, [showToast, state.products, state.shopping]);

  const value = useMemo<InventoryContextValue>(() => ({
    ...state,
    isHydrated,
    toast,
    addProduct,
    updateProduct,
    adjustQuantity,
    deleteProduct,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearPurchased,
    movePurchasedToInventory,
    showToast,
  }), [
    state,
    isHydrated,
    toast,
    addProduct,
    updateProduct,
    adjustQuantity,
    deleteProduct,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearPurchased,
    movePurchasedToInventory,
    showToast,
  ]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used inside InventoryProvider');
  return context;
}
