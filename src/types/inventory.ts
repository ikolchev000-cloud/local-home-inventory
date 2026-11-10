export type CategoryId =
  | 'dairy'
  | 'produce'
  | 'meat'
  | 'frozen'
  | 'pantry'
  | 'drinks'
  | 'bakery'
  | 'other';

export type LocationId = 'fridge' | 'freezer' | 'pantry';
export type Unit = 'шт' | 'кг' | 'г' | 'л' | 'мл' | 'уп';
export type EventType = 'added' | 'consumed' | 'wasted';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: CategoryId;
  location: LocationId;
  quantity: number;
  unit: Unit;
  minQuantity: number;
  expiresAt: string | null;
  barcode?: string;
  price?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export interface InventoryEvent {
  id: string;
  productId: string;
  productName: string;
  category: CategoryId;
  type: EventType;
  quantity: number;
  unit: Unit;
  value: number;
  date: string;
}

export interface ShoppingItem {
  id: string;
  productId?: string;
  name: string;
  category: CategoryId;
  quantity: number;
  unit: Unit;
  checked: boolean;
  createdAt: string;
}

export interface InventoryState {
  products: Product[];
  events: InventoryEvent[];
  shopping: ShoppingItem[];
}
