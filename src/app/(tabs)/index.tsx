import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowRight,
  Bell,
  Boxes,
  ChevronRight,
  Clock3,
  PackageOpen,
  Refrigerator,
  ScanLine,
  ShoppingBasket,
  Snowflake,
  TriangleAlert,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { IconButton, SectionHeader } from '@/components/ui';
import { ProductRow } from '@/components/ProductRow';
import { colors, fonts, shadows } from '@/constants/theme';
import { useInventory } from '@/context/InventoryContext';
import { locations } from '@/data/catalog';
import type { LocationId } from '@/types/inventory';
import { daysUntil, plural } from '@/utils/date';
import { isLowStock } from '@/utils/inventory';

const locationIcons: Record<LocationId, LucideIcon> = {
  fridge: Refrigerator,
  freezer: Snowflake,
  pantry: Boxes,
};

export default function HomeScreen() {
  const { products, shopping } = useInventory();
  const activeProducts = products.filter((product) => product.quantity > 0);
  const expiring = useMemo(() => activeProducts
    .filter((product) => daysUntil(product.expiresAt) <= 3)
    .sort((a, b) => daysUntil(a.expiresAt) - daysUntil(b.expiresAt)), [activeProducts]);
  const lowStock = activeProducts.filter(isLowStock);
  const attention = [...new Map([...expiring, ...lowStock].map((product) => [product.id, product])).values()].slice(0, 3);
  const shoppingCount = shopping.filter((item) => !item.checked).length;
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logo}><PackageOpen size={21} color={colors.ink} strokeWidth={1.8} /></View>
            <Text style={styles.brand}>полка</Text>
          </View>
          <View>
            <IconButton icon={Bell} label="Продукты, требующие внимания" onPress={() => router.push('/inventory?attention=1')} />
            {attention.length ? <View style={styles.notificationDot} /> : null}
          </View>
        </View>

        <Text style={styles.greeting}>{greeting}!</Text>
        <Text style={styles.subtitle}>Всё нужное — под рукой, ничего лишнего.</Text>

        <LinearGradient colors={['#2D4636', '#1C2E23']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={[styles.heroOrb, styles.heroOrbOne]} />
          <View style={[styles.heroOrb, styles.heroOrbTwo]} />
          <View style={styles.heroTop}>
            <View style={styles.heroEyebrow}><View style={styles.liveDot} /><Text style={styles.heroEyebrowText}>ДОМАШНИЕ ЗАПАСЫ</Text></View>
            <View style={styles.heroCount}><Text style={styles.heroCountText}>{activeProducts.length}</Text></View>
          </View>
          <Text style={styles.heroTitle}>Порядок на полках.{'\n'}Спокойствие в доме.</Text>
          <Text style={styles.heroDescription}>
            {activeProducts.length} {plural(activeProducts.length, ['продукт', 'продукта', 'продуктов'])} в учёте · {expiring.length} требуют внимания
          </Text>
          <Pressable onPress={() => router.push('/scanner')} style={({ pressed }) => [styles.heroButton, pressed && { opacity: 0.85 }]}>
            <ScanLine size={19} color={colors.ink} />
            <Text style={styles.heroButtonText}>Сканировать продукт</Text>
            <ArrowRight size={18} color={colors.ink} />
          </Pressable>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard icon={TriangleAlert} value={lowStock.length} label="Заканчивается" color={colors.orange} background={colors.orangeMuted} onPress={() => router.push('/inventory?attention=1')} />
          <StatCard icon={Clock3} value={expiring.length} label="Скоро истекает" color={colors.red} background={colors.redMuted} onPress={() => router.push('/inventory?attention=1')} />
          <StatCard icon={ShoppingBasket} value={shoppingCount} label="В покупках" color={colors.green} background={colors.greenMuted} onPress={() => router.navigate('/shopping')} />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Места хранения" action="Все запасы" onAction={() => router.navigate('/inventory')} />
          <View style={styles.locationRow}>
            {(Object.keys(locations) as LocationId[]).map((location) => {
              const Icon = locationIcons[location];
              const count = activeProducts.filter((product) => product.location === location).length;
              return (
                <Pressable key={location} onPress={() => router.push({ pathname: '/inventory', params: { location } })} style={({ pressed }) => [styles.locationCard, pressed && { opacity: 0.75 }]}>
                  <View style={[styles.locationIcon, location === 'freezer' && { backgroundColor: colors.blueMuted }, location === 'pantry' && { backgroundColor: colors.orangeMuted }]}>
                    <Icon size={21} color={location === 'freezer' ? colors.blue : location === 'pantry' ? colors.orange : colors.green} strokeWidth={1.6} />
                  </View>
                  <Text style={styles.locationName}>{locations[location].name}</Text>
                  <View style={styles.locationBottom}>
                    <Text style={styles.locationCount}>{count} {plural(count, ['вид', 'вида', 'видов'])}</Text>
                    <ChevronRight size={13} color={colors.textTertiary} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Требуют внимания" action="Открыть список" onAction={() => router.push('/inventory?attention=1')} />
          {attention.length ? attention.map((product) => <ProductRow key={product.id} product={product} />) : (
            <View style={styles.allGood}><Text style={styles.allGoodText}>Все продукты в порядке. Отличная работа!</Text></View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon: Icon, value, label, color, background, onPress }: { icon: LucideIcon; value: number; label: string; color: string; background: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.75 }]}>
      <View style={[styles.statIcon, { backgroundColor: background }]}><Icon size={16} color={color} strokeWidth={1.8} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 9, paddingBottom: 118 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: fonts.extrabold, fontSize: 23, color: colors.ink, letterSpacing: -1.2 },
  notificationDot: { position: 'absolute', right: 8, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red, borderWidth: 1.5, borderColor: colors.white },
  greeting: { fontFamily: fonts.extrabold, fontSize: 29, lineHeight: 35, color: colors.ink, letterSpacing: -1 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 5, marginBottom: 23 },
  hero: { borderRadius: 28, padding: 22, overflow: 'hidden', ...shadows.card },
  heroOrb: { position: 'absolute', borderRadius: 999, backgroundColor: '#DDF58A0B' },
  heroOrbOne: { width: 220, height: 220, right: -90, top: -90 },
  heroOrbTwo: { width: 120, height: 120, left: -55, bottom: -45 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  heroEyebrowText: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.4, color: '#D8E0D9' },
  heroCount: { minWidth: 32, height: 27, borderRadius: 10, paddingHorizontal: 8, backgroundColor: '#FFFFFF12', alignItems: 'center', justifyContent: 'center' },
  heroCountText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 12 },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 25, lineHeight: 32, letterSpacing: -0.8, color: colors.white },
  heroDescription: { fontFamily: fonts.regular, fontSize: 11, color: '#B9C6BC', marginTop: 10, marginBottom: 21 },
  heroButton: { height: 48, borderRadius: 16, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 9 },
  heroButtonText: { flex: 1, fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  statsRow: { flexDirection: 'row', gap: 9, marginTop: 13 },
  statCard: { flex: 1, minHeight: 119, backgroundColor: colors.surface, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.border },
  statIcon: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 25, color: colors.ink },
  statLabel: { fontFamily: fonts.medium, fontSize: 9, lineHeight: 13, color: colors.textSecondary, marginTop: 3 },
  section: { marginTop: 28 },
  locationRow: { flexDirection: 'row', gap: 9 },
  locationCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 19, padding: 12, borderWidth: 1, borderColor: colors.border },
  locationIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenMuted, marginBottom: 13 },
  locationName: { fontFamily: fonts.bold, fontSize: 10, color: colors.ink, marginBottom: 5 },
  locationBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationCount: { fontFamily: fonts.medium, fontSize: 8, color: colors.textSecondary },
  allGood: { padding: 24, borderRadius: 20, backgroundColor: colors.greenMuted, alignItems: 'center' },
  allGoodText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.green },
});
