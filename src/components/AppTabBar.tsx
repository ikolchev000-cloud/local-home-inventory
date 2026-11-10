import { BarChart3, Home, Package, ScanLine, ShoppingBasket } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { colors, fonts, shadows } from '@/constants/theme';

const items: { path: '/' | '/inventory' | '/analytics' | '/shopping'; label: string; icon: LucideIcon }[] = [
  { path: '/', label: 'Главная', icon: Home },
  { path: '/inventory', label: 'Запасы', icon: Package },
  { path: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { path: '/shopping', label: 'Покупки', icon: ShoppingBasket },
];

export function AppTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {items.slice(0, 2).map((item) => <TabItem key={item.path} item={item} active={pathname === item.path} />)}
        <View style={styles.scanSpace} />
        {items.slice(2).map((item) => <TabItem key={item.path} item={item} active={pathname === item.path} />)}
        <Pressable
          accessibilityLabel="Сканировать продукт"
          accessibilityRole="button"
          onPress={() => router.push('/scanner')}
          style={({ pressed }) => [styles.scanButton, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <ScanLine size={27} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
        <Text style={styles.scanLabel}>Сканер</Text>
      </View>
    </View>
  );
}

function TabItem({ item, active }: { item: (typeof items)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={() => router.navigate(item.path)}
      style={styles.tabItem}
    >
      <Icon size={21} color={active ? colors.ink : colors.textTertiary} strokeWidth={active ? 2.2 : 1.8} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
      {active ? <View style={styles.activeDot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bar: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    height: 82,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    paddingTop: 11,
    paddingHorizontal: 8,
    ...shadows.card,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4, position: 'relative' },
  tabLabel: { fontFamily: fonts.medium, fontSize: 9, color: colors.textTertiary },
  tabLabelActive: { color: colors.ink, fontFamily: fonts.semibold },
  activeDot: { position: 'absolute', bottom: -5, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.green },
  scanSpace: { width: 74 },
  scanButton: {
    position: 'absolute',
    top: -25,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.surface,
    ...shadows.floating,
  },
  scanLabel: { position: 'absolute', top: 44, left: '50%', marginLeft: -37, width: 74, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 9, color: colors.ink },
});
