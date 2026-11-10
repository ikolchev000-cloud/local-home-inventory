import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Boxes, PackageOpen, Plus, Refrigerator, ScanLine, Search, Snowflake, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ProductRow } from '@/components/ProductRow';
import { EmptyState, ScreenHeader } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useInventory } from '@/context/InventoryContext';
import { locations } from '@/data/catalog';
import type { LocationId } from '@/types/inventory';
import { daysUntil, plural } from '@/utils/date';
import { needsAttention } from '@/utils/inventory';

type Filter = 'all' | LocationId;
const filterIcons: Record<Filter, LucideIcon | null> = { all: null, fridge: Refrigerator, freezer: Snowflake, pantry: Boxes };

export default function InventoryScreen() {
  const { products } = useInventory();
  const params = useLocalSearchParams<{ attention?: string; location?: LocationId }>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(params.location ?? 'all');
  const [attentionOnly, setAttentionOnly] = useState(params.attention === '1');

  useFocusEffect(useCallback(() => {
    if (params.location) setFilter(params.location);
    if (params.attention) setAttentionOnly(params.attention === '1');
  }, [params.attention, params.location]));

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');
    return products
      .filter((product) => filter === 'all' || product.location === filter)
      .filter((product) => !attentionOnly || needsAttention(product))
      .filter((product) => !normalizedQuery || `${product.name} ${product.brand ?? ''} ${product.barcode ?? ''}`.toLocaleLowerCase('ru').includes(normalizedQuery))
      .sort((a, b) => daysUntil(a.expiresAt) - daysUntil(b.expiresAt));
  }, [attentionOnly, filter, products, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Мои запасы"
          subtitle={`${products.length} ${plural(products.length, ['продукт', 'продукта', 'продуктов'])} в доме`}
          action={<Pressable accessibilityLabel="Добавить продукт" onPress={() => router.push('/product-form')} style={styles.addButton}><Plus size={22} color={colors.ink} /></Pressable>}
        />

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Найти продукт или код"
              placeholderTextColor={colors.textTertiary}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query ? <Pressable onPress={() => setQuery('')} accessibilityLabel="Очистить поиск"><X size={16} color={colors.textSecondary} /></Pressable> : null}
          </View>
          <Pressable accessibilityLabel="Сканировать" onPress={() => router.push('/scanner')} style={styles.scanButton}><ScanLine size={20} color={colors.white} /></Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', 'fridge', 'freezer', 'pantry'] as Filter[]).map((item) => {
            const Icon = filterIcons[item];
            const active = filter === item && !attentionOnly;
            return (
              <Pressable key={item} onPress={() => { setFilter(item); setAttentionOnly(false); }} style={[styles.filter, active && styles.filterActive]}>
                {Icon ? <Icon size={14} color={active ? colors.white : colors.textSecondary} /> : null}
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item === 'all' ? 'Все продукты' : locations[item].name}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setAttentionOnly((value) => !value)} style={[styles.filter, attentionOnly && styles.attentionFilter]}>
            <Text style={[styles.filterText, attentionOnly && styles.attentionFilterText]}>Требуют внимания</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{attentionOnly ? 'Нужно проверить' : filter === 'all' ? 'Все продукты' : locations[filter].name}</Text>
          <Text style={styles.listCount}>{filtered.length}</Text>
        </View>

        {filtered.length ? filtered.map((product) => <ProductRow key={product.id} product={product} />) : (
          <EmptyState
            icon={PackageOpen}
            title={query ? 'Ничего не найдено' : 'Здесь пока пусто'}
            description={query ? 'Попробуйте изменить запрос или выбрать другое место хранения.' : 'Добавьте первый продукт вручную или отсканируйте упаковку.'}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 118 },
  addButton: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  searchBox: { flex: 1, height: 49, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 12, color: colors.ink, paddingVertical: 0, outlineStyle: 'none' } as never,
  scanButton: { width: 49, height: 49, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingRight: 20, paddingBottom: 3 },
  filter: { height: 36, borderRadius: 12, paddingHorizontal: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  attentionFilter: { backgroundColor: colors.orangeMuted, borderColor: colors.orangeMuted },
  attentionFilterText: { color: colors.orange },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 14 },
  listTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  listCount: { fontFamily: fonts.bold, fontSize: 11, color: colors.textSecondary, backgroundColor: colors.surfaceMuted, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden' },
});
