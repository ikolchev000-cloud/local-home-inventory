import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ProductArtwork } from '@/components/ProductArtwork';
import { colors, fonts } from '@/constants/theme';
import { useInventory } from '@/context/InventoryContext';
import { locations } from '@/data/catalog';
import type { Product } from '@/types/inventory';
import { daysUntil, formatQuantity, formatShortDate } from '@/utils/date';
import { isLowStock, quantityStep } from '@/utils/inventory';

export function ProductRow({ product }: { product: Product }) {
  const { adjustQuantity, showToast } = useInventory();
  const days = daysUntil(product.expiresAt);
  const low = isLowStock(product);
  const step = quantityStep(product.unit);
  const expiryColor = days < 0 ? colors.red : days <= 3 ? colors.orange : colors.textSecondary;

  function change(amount: number, type: 'added' | 'consumed') {
    adjustQuantity(product.id, amount, type);
    if (type === 'consumed' && product.quantity <= 0) return;
    showToast(type === 'added' ? `${product.name}: запас пополнен` : `${product.name}: списано ${formatQuantity(amount)} ${product.unit}`);
  }

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
    >
      <ProductArtwork category={product.category} size={54} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.meta, { color: expiryColor }]} numberOfLines={1}>
          {locations[product.location].name} · {product.expiresAt ? `до ${formatShortDate(product.expiresAt)}` : 'без срока'}
        </Text>
        {low ? (
          <View style={styles.lowBadge}><Text style={styles.lowText}>Заканчивается</Text></View>
        ) : null}
      </View>
      <View style={styles.quantityArea}>
        <View style={styles.stepper}>
          <Pressable
            accessibilityLabel={`Списать ${product.name}`}
            accessibilityRole="button"
            hitSlop={6}
            onPress={(event) => { event.stopPropagation(); change(step, 'consumed'); }}
            style={styles.stepButton}
          >
            <Minus size={15} color={colors.text} />
          </Pressable>
          <Text style={styles.quantity}>{formatQuantity(product.quantity)}</Text>
          <Pressable
            accessibilityLabel={`Пополнить ${product.name}`}
            accessibilityRole="button"
            hitSlop={6}
            onPress={(event) => { event.stopPropagation(); change(step, 'added'); }}
            style={[styles.stepButton, styles.plusButton]}
          >
            <Plus size={15} color={colors.ink} />
          </Pressable>
        </View>
        <Text style={styles.unit}>{product.unit}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 21, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  content: { flex: 1, marginLeft: 12, marginRight: 6, alignItems: 'flex-start' },
  name: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, maxWidth: '100%', marginBottom: 5 },
  meta: { fontFamily: fonts.medium, fontSize: 10, maxWidth: '100%' },
  lowBadge: { backgroundColor: colors.orangeMuted, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginTop: 6 },
  lowText: { fontFamily: fonts.semibold, fontSize: 8, color: colors.orange },
  quantityArea: { alignItems: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepButton: { width: 28, height: 30, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  plusButton: { backgroundColor: colors.accent },
  quantity: { minWidth: 30, textAlign: 'center', fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  unit: { fontFamily: fonts.medium, fontSize: 9, color: colors.textSecondary, marginTop: 3 },
});
