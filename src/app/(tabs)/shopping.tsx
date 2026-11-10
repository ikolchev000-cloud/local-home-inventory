import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronRight, PackagePlus, Plus, ShoppingBasket, Trash2 } from 'lucide-react-native';
import { ProductArtwork } from '@/components/ProductArtwork';
import { EmptyState, ScreenHeader } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useInventory } from '@/context/InventoryContext';
import { formatQuantity, plural } from '@/utils/date';
import { isLowStock } from '@/utils/inventory';

export default function ShoppingScreen() {
  const {
    products,
    shopping,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearPurchased,
    movePurchasedToInventory,
    showToast,
  } = useInventory();
  const [newItem, setNewItem] = useState('');
  const pending = shopping.filter((item) => !item.checked);
  const purchased = shopping.filter((item) => item.checked);
  const progress = shopping.length ? purchased.length / shopping.length : 0;
  const suggestions = useMemo(() => products.filter((product) =>
    isLowStock(product) && !shopping.some((item) => item.productId === product.id && !item.checked),
  ).slice(0, 5), [products, shopping]);

  function addCustomItem() {
    const name = newItem.trim();
    if (!name) return;
    addShoppingItem({ name, category: 'other', quantity: 1, unit: 'шт' });
    setNewItem('');
    showToast('Добавлено в список покупок');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader title="Список покупок" subtitle={`${pending.length} ${plural(pending.length, ['позиция', 'позиции', 'позиций'])} осталось купить`} />

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View><Text style={styles.progressEyebrow}>ПОКУПКИ БЕЗ ЛИШНЕГО</Text><Text style={styles.progressTitle}>{shopping.length ? `${purchased.length} из ${shopping.length} собрано` : 'Список готов к покупкам'}</Text></View>
            <View style={styles.basketIcon}><ShoppingBasket size={24} color={colors.ink} /></View>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(progress * 100, shopping.length ? 3 : 0)}%` }]} /></View>
          <Text style={styles.progressHint}>Отмечайте купленное, затем одним нажатием пополните запасы.</Text>
        </View>

        <View style={styles.addRow}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addCustomItem}
            placeholder="Что нужно купить?"
            placeholderTextColor={colors.textTertiary}
            style={styles.addInput}
            returnKeyType="done"
          />
          <Pressable accessibilityLabel="Добавить в покупки" onPress={addCustomItem} style={[styles.addButton, !newItem.trim() && { opacity: 0.4 }]}><Plus size={22} color={colors.ink} /></Pressable>
        </View>

        {suggestions.length ? (
          <View style={styles.suggestionsSection}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Заканчивается дома</Text><Text style={styles.sectionHint}>Нажмите, чтобы добавить</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
              {suggestions.map((product) => (
                <Pressable
                  key={product.id}
                  style={styles.suggestion}
                  onPress={() => {
                    addShoppingItem({ productId: product.id, name: product.name, category: product.category, quantity: Math.max(product.minQuantity, 1), unit: product.unit });
                    showToast(`${product.name} — в списке покупок`);
                  }}
                >
                  <ProductArtwork category={product.category} size={39} />
                  <Text style={styles.suggestionName} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.suggestionBottom}><Text style={styles.suggestionMeta}>Осталось {formatQuantity(product.quantity)} {product.unit}</Text><Plus size={14} color={colors.green} /></View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.listSection}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Нужно купить</Text><Text style={styles.countBadge}>{pending.length}</Text></View>
          {pending.map((item) => (
            <ShoppingRow key={item.id} item={item} onToggle={() => toggleShoppingItem(item.id)} onRemove={() => removeShoppingItem(item.id)} />
          ))}
          {!pending.length ? <View style={styles.compactEmpty}><Check size={18} color={colors.green} /><Text style={styles.compactEmptyText}>Всё необходимое уже собрано</Text></View> : null}
        </View>

        {purchased.length ? (
          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Куплено</Text>
              <Pressable onPress={clearPurchased}><Text style={styles.clearText}>Очистить</Text></Pressable>
            </View>
            {purchased.map((item) => (
              <ShoppingRow key={item.id} item={item} onToggle={() => toggleShoppingItem(item.id)} onRemove={() => removeShoppingItem(item.id)} />
            ))}
            <Pressable onPress={movePurchasedToInventory} style={({ pressed }) => [styles.moveButton, pressed && { opacity: 0.85 }]}>
              <PackagePlus size={19} color={colors.white} />
              <Text style={styles.moveButtonText}>Перенести купленное в запасы</Text>
              <ChevronRight size={17} color={colors.white} />
            </Pressable>
          </View>
        ) : null}

        {!shopping.length ? <EmptyState icon={ShoppingBasket} title="Список пока пуст" description="Добавьте продукт выше или выберите то, что заканчивается дома." /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ShoppingRow({ item, onToggle, onRemove }: { item: ReturnType<typeof useInventory>['shopping'][number]; onToggle: () => void; onRemove: () => void }) {
  return (
    <View style={[styles.itemRow, item.checked && styles.itemRowChecked]}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.checked }} onPress={onToggle} style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked ? <Check size={15} color={colors.ink} strokeWidth={2.5} /> : null}
      </Pressable>
      <ProductArtwork category={item.category} size={43} />
      <View style={styles.itemContent}><Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text><Text style={styles.itemQuantity}>{formatQuantity(item.quantity)} {item.unit}</Text></View>
      <Pressable accessibilityLabel={`Удалить ${item.name}`} onPress={onRemove} hitSlop={8} style={styles.deleteButton}><Trash2 size={16} color={colors.textTertiary} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 118 },
  progressCard: { backgroundColor: colors.ink, borderRadius: 24, padding: 20, marginBottom: 14 },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  progressEyebrow: { fontFamily: fonts.semibold, fontSize: 8, letterSpacing: 1.2, color: '#A8B7AC', marginBottom: 6 },
  progressTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.white },
  basketIcon: { width: 47, height: 47, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: '#FFFFFF20', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  progressHint: { fontFamily: fonts.regular, fontSize: 9, lineHeight: 14, color: '#A8B7AC', marginTop: 11 },
  addRow: { flexDirection: 'row', gap: 9 },
  addInput: { flex: 1, height: 50, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, fontFamily: fonts.medium, fontSize: 12, color: colors.ink },
  addButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  suggestionsSection: { marginTop: 27 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  sectionHint: { fontFamily: fonts.regular, fontSize: 8, color: colors.textTertiary },
  suggestions: { gap: 10, paddingRight: 20 },
  suggestion: { width: 137, padding: 11, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  suggestionName: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 14, color: colors.ink, marginTop: 9, minHeight: 28 },
  suggestionBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  suggestionMeta: { fontFamily: fonts.medium, fontSize: 8, color: colors.textSecondary, flex: 1 },
  listSection: { marginTop: 27 },
  countBadge: { minWidth: 25, textAlign: 'center', fontFamily: fonts.bold, fontSize: 10, color: colors.textSecondary, backgroundColor: colors.surfaceMuted, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 9 },
  itemRowChecked: { opacity: 0.66 },
  checkbox: { width: 22, height: 22, borderRadius: 8, borderWidth: 1.5, borderColor: '#C8CEC7', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  itemContent: { flex: 1 },
  itemName: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink, marginBottom: 4 },
  itemNameChecked: { textDecorationLine: 'line-through', color: colors.textSecondary },
  itemQuantity: { fontFamily: fonts.medium, fontSize: 9, color: colors.textSecondary },
  deleteButton: { padding: 6 },
  compactEmpty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18, borderRadius: 16, backgroundColor: colors.greenMuted },
  compactEmptyText: { fontFamily: fonts.medium, fontSize: 11, color: colors.green },
  clearText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.red },
  moveButton: { height: 50, borderRadius: 16, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 9, marginTop: 4 },
  moveButtonText: { flex: 1, fontFamily: fonts.bold, fontSize: 11, color: colors.white },
});
