import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Barcode,
  CalendarDays,
  MapPin,
  Minus,
  PackageOpen,
  Pencil,
  Plus,
  ShoppingBasket,
  Trash2,
  TriangleAlert,
  WalletCards,
} from 'lucide-react-native';
import { ProductArtwork } from '@/components/ProductArtwork';
import { BackButton, ConfirmDialog, EmptyState, IconButton } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useInventory } from '@/context/InventoryContext';
import { categories, locations } from '@/data/catalog';
import { daysUntil, expiryLabel, formatMoney, formatQuantity, formatShortDate } from '@/utils/date';
import { isLowStock, quantityStep } from '@/utils/inventory';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, adjustQuantity, deleteProduct, addShoppingItem, showToast } = useInventory();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const product = products.find((item) => item.id === id);

  if (!product) {
    return <SafeAreaView style={styles.safe}><View style={styles.missing}><EmptyState icon={PackageOpen} title="Продукт не найден" description="Возможно, он был удалён из домашних запасов." /><BackButton /></View></SafeAreaView>;
  }

  const days = daysUntil(product.expiresAt);
  const low = isLowStock(product);
  const step = quantityStep(product.unit);
  const stockRatio = Math.min(product.quantity / Math.max(product.minQuantity * 2, 1), 1);

  function change(type: 'added' | 'consumed' | 'wasted') {
    if (!product || (type !== 'added' && product.quantity === 0)) return;
    adjustQuantity(product.id, step, type);
    showToast(type === 'added' ? 'Запас пополнен' : type === 'wasted' ? 'Отмечено как испорченное' : 'Продукт списан');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Карточка продукта</Text>
          <IconButton icon={Pencil} label="Редактировать" onPress={() => router.push({ pathname: '/product-form', params: { id: product.id } })} />
        </View>

        <View style={styles.productHero}>
          <ProductArtwork category={product.category} size={92} />
          <View style={[styles.categoryBadge, { backgroundColor: categories[product.category].background }]}><Text style={[styles.categoryText, { color: categories[product.category].color }]}>{categories[product.category].shortName}</Text></View>
          <Text style={styles.productName}>{product.name}</Text>
          {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
          <View style={[styles.expiryBadge, { backgroundColor: days <= 1 ? colors.redMuted : days <= 3 ? colors.orangeMuted : colors.greenMuted }]}>
            {days <= 3 ? <TriangleAlert size={14} color={days <= 1 ? colors.red : colors.orange} /> : <CalendarDays size={14} color={colors.green} />}
            <Text style={[styles.expiryText, { color: days <= 1 ? colors.red : days <= 3 ? colors.orange : colors.green }]}>{expiryLabel(product.expiresAt)}</Text>
          </View>
        </View>

        <View style={styles.quantityCard}>
          <Text style={styles.quantityEyebrow}>СЕЙЧАС В ЗАПАСАХ</Text>
          <View style={styles.quantityRow}>
            <Pressable accessibilityLabel="Использовать продукт" accessibilityRole="button" onPress={() => change('consumed')} style={[styles.bigStep, product.quantity === 0 && { opacity: 0.35 }]}><Minus size={25} color={colors.white} /></Pressable>
            <View style={styles.quantityValueWrap}><Text style={styles.quantityValue}>{formatQuantity(product.quantity)}</Text><Text style={styles.quantityUnit}>{product.unit}</Text></View>
            <Pressable accessibilityLabel="Пополнить продукт" accessibilityRole="button" onPress={() => change('added')} style={[styles.bigStep, styles.bigPlus]}><Plus size={25} color={colors.ink} /></Pressable>
          </View>
          <View style={styles.stockTrack}><View style={[styles.stockFill, { width: `${stockRatio * 100}%`, backgroundColor: low ? '#E9A26B' : colors.accent }]} /></View>
          <Text style={styles.stockHint}>{low ? 'Пора пополнить · ' : ''}Минимум: {formatQuantity(product.minQuantity)} {product.unit}</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoCard icon={MapPin} label="Место хранения" value={locations[product.location].name} />
          <InfoCard icon={CalendarDays} label="Годен до" value={formatShortDate(product.expiresAt)} />
          <InfoCard icon={WalletCards} label="Цена за единицу" value={product.price ? formatMoney(product.price) : 'Не указана'} />
          <InfoCard icon={Barcode} label="Штрихкод" value={product.barcode || 'Не указан'} />
        </View>

        {product.note ? <View style={styles.noteCard}><Text style={styles.noteLabel}>Заметка</Text><Text style={styles.noteText}>{product.note}</Text></View> : null}

        <View style={styles.actions}>
          <Pressable style={styles.shoppingButton} onPress={() => {
            addShoppingItem({ productId: product.id, name: product.name, category: product.category, quantity: Math.max(product.minQuantity, 1), unit: product.unit });
            showToast('Добавлено в список покупок');
          }}><ShoppingBasket size={18} color={colors.ink} /><Text style={styles.shoppingButtonText}>В список покупок</Text></Pressable>
          <Pressable style={[styles.wasteButton, product.quantity === 0 && { opacity: 0.4 }]} onPress={() => change('wasted')}><Trash2 size={17} color={colors.red} /><Text style={styles.wasteButtonText}>Списать {formatQuantity(step)} {product.unit} как испорченное</Text></Pressable>
        </View>

        <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteProduct}><Trash2 size={15} color={colors.red} /><Text style={styles.deleteProductText}>Удалить карточку продукта</Text></Pressable>
      </ScrollView>
      <ConfirmDialog
        visible={confirmDelete}
        title="Удалить продукт?"
        description="Карточка исчезнет из запасов. История расхода сохранится для аналитики."
        confirmLabel="Удалить"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { deleteProduct(product.id); setConfirmDelete(false); router.back(); showToast('Продукт удалён'); }}
      />
    </SafeAreaView>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <View style={styles.infoCard}><Icon size={17} color={colors.textSecondary} /><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue} numberOfLines={1}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 42 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  productHero: { alignItems: 'center', paddingTop: 29, paddingBottom: 24 },
  categoryBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, marginTop: 14 },
  categoryText: { fontFamily: fonts.semibold, fontSize: 9 },
  productName: { fontFamily: fonts.extrabold, fontSize: 25, lineHeight: 32, letterSpacing: -0.8, color: colors.ink, textAlign: 'center', marginTop: 11 },
  brand: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginTop: 14 },
  expiryText: { fontFamily: fonts.semibold, fontSize: 10 },
  quantityCard: { backgroundColor: colors.ink, borderRadius: 25, padding: 20 },
  quantityEyebrow: { textAlign: 'center', fontFamily: fonts.semibold, fontSize: 8, letterSpacing: 1.4, color: '#A7B4AA' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 17 },
  bigStep: { width: 51, height: 51, borderRadius: 17, backgroundColor: '#FFFFFF15', alignItems: 'center', justifyContent: 'center' },
  bigPlus: { backgroundColor: colors.accent },
  quantityValueWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  quantityValue: { fontFamily: fonts.extrabold, fontSize: 38, color: colors.white, letterSpacing: -1 },
  quantityUnit: { fontFamily: fonts.medium, fontSize: 15, color: '#B8C5BA' },
  stockTrack: { height: 5, borderRadius: 3, backgroundColor: '#FFFFFF18', overflow: 'hidden' },
  stockFill: { height: '100%', borderRadius: 3 },
  stockHint: { fontFamily: fonts.medium, fontSize: 9, color: '#A7B4AA', textAlign: 'center', marginTop: 10 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  infoCard: { width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border },
  infoLabel: { fontFamily: fonts.regular, fontSize: 9, color: colors.textSecondary, marginTop: 12, marginBottom: 4 },
  infoValue: { fontFamily: fonts.bold, fontSize: 11, color: colors.ink },
  noteCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  noteLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.ink, marginBottom: 5 },
  noteText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  actions: { gap: 9, marginTop: 19 },
  shoppingButton: { height: 51, borderRadius: 16, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  shoppingButtonText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  wasteButton: { height: 48, borderRadius: 16, backgroundColor: colors.redMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  wasteButtonText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.red },
  deleteProduct: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 22 },
  deleteProductText: { fontFamily: fonts.medium, fontSize: 10, color: colors.red },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
