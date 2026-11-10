import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  PackageCheck,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { ScreenHeader } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useInventory } from '@/context/InventoryContext';
import { categories } from '@/data/catalog';
import { formatMoney, formatMonth, formatQuantity, plural } from '@/utils/date';
import { getAnalytics } from '@/utils/analytics';

export default function AnalyticsScreen() {
  const { events } = useInventory();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const month = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);
  const stats = useMemo(() => getAnalytics(events, month), [events, month]);
  const maxWeek = Math.max(...stats.weeks.map((week) => week.consumed + week.wasted), 1);
  const activeWeek = selectedWeek === null ? stats.weeks.reduce((best, week, index) => week.consumed > stats.weeks[best].consumed ? index : best, 0) : selectedWeek;
  const isPositiveChange = stats.consumptionChange <= 0;

  function changeMonth(direction: number) {
    setMonthOffset((value) => Math.min(0, value + direction));
    setSelectedWeek(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader title="Аналитика" subtitle="Осознанное потребление без лишнего" />
        <View style={styles.monthSwitcher}>
          <Pressable accessibilityLabel="Предыдущий месяц" onPress={() => changeMonth(-1)} style={styles.monthArrow}><ChevronLeft size={18} color={colors.ink} /></Pressable>
          <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
          <Pressable accessibilityLabel="Следующий месяц" disabled={monthOffset === 0} onPress={() => changeMonth(1)} style={[styles.monthArrow, monthOffset === 0 && { opacity: 0.3 }]}><ChevronRight size={18} color={colors.ink} /></Pressable>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.eyebrow}>РАСХОД ПРОДУКТОВ</Text>
              <View style={styles.totalRow}>
                <Text style={styles.total}>{formatQuantity(stats.consumed)}</Text>
                <Text style={styles.totalUnit}>ед.</Text>
                {stats.previousConsumed ? (
                  <View style={[styles.changeBadge, { backgroundColor: isPositiveChange ? colors.greenMuted : colors.orangeMuted }]}>
                    {isPositiveChange ? <ArrowDownRight size={12} color={colors.green} /> : <ArrowUpRight size={12} color={colors.orange} />}
                    <Text style={[styles.changeText, { color: isPositiveChange ? colors.green : colors.orange }]}>{Math.abs(Math.round(stats.consumptionChange))}%</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.green }]} /><Text style={styles.legendText}>Расход</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#E5B09D' }]} /><Text style={styles.legendText}>Потери</Text></View>
            </View>
          </View>

          <View style={styles.bars}>
            {stats.weeks.map((week, index) => {
              const consumedHeight = Math.max(week.consumed ? 6 : 0, (week.consumed / maxWeek) * 132);
              const wastedHeight = Math.max(week.wasted ? 6 : 0, (week.wasted / maxWeek) * 132);
              return (
                <Pressable key={week.label} onPress={() => setSelectedWeek(index)} style={styles.barGroup}>
                  <View style={styles.barValueArea}>{activeWeek === index ? <Text style={styles.barValue}>{formatQuantity(week.consumed + week.wasted)}</Text> : null}</View>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: consumedHeight, backgroundColor: activeWeek === index ? colors.green : '#A9BCAE' }]} />
                    <View style={[styles.bar, { height: wastedHeight, backgroundColor: '#E5B09D' }]} />
                  </View>
                  <Text style={[styles.barLabel, activeWeek === index && styles.barLabelActive]}>{week.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.chartFooter}><Text style={styles.chartFooterText}>Неделя {activeWeek + 1}: {formatQuantity(stats.weeks[activeWeek].consumed)} ед. использовано</Text><Text style={styles.chartFooterMuted}>по неделям месяца</Text></View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.greenMuted }]}><CircleDollarSign size={20} color={colors.green} /></View>
            <Text style={styles.metricLabel}>Пополнения</Text>
            <Text style={styles.metricValue}>{formatMoney(stats.spent)}</Text>
            <Text style={styles.metricHint}>по указанным ценам</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.redMuted }]}><Trash2 size={19} color={colors.red} /></View>
            <Text style={styles.metricLabel}>Потери</Text>
            <Text style={styles.metricValue}>{formatQuantity(stats.wasted)} <Text style={styles.metricUnit}>ед.</Text></Text>
            <Text style={styles.metricHint}>испорчено за месяц</Text>
          </View>
        </View>

        <View style={styles.categoryCard}>
          <Text style={styles.sectionTitle}>Что расходуется чаще</Text>
          <Text style={styles.sectionSubtitle}>Доля категорий в общем расходе</Text>
          {stats.categoryStats.length ? (
            <View style={styles.categoryContent}>
              <View style={styles.donutWrap}>
                <Donut stats={stats.categoryStats} />
                <View style={styles.donutCenter}>
                  <Text style={styles.donutValue}>{stats.consumedEvents.length}</Text>
                  <Text style={styles.donutLabel}>{plural(stats.consumedEvents.length, ['списание', 'списания', 'списаний'])}</Text>
                </View>
              </View>
              <View style={styles.categoryLegend}>
                {stats.categoryStats.slice(0, 4).map((item) => (
                  <View key={item.category} style={styles.categoryRow}>
                    <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName} numberOfLines={1}>{categories[item.category].shortName}</Text>
                    <Text style={styles.categoryPercent}>{Math.round(item.share * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : <Text style={styles.noData}>В этом месяце ещё не было списаний.</Text>}
        </View>

        {stats.topCategory ? (
          <LinearInsight
            title="Небольшое наблюдение"
            text={`${categories[stats.topCategory.category].shortName} — основная категория расхода. Проверяйте остатки перед покупкой, чтобы не брать лишнее.`}
          />
        ) : (
          <LinearInsight title="Начните вести историю" text="Списывайте продукты через сканер или кнопку минус — здесь появятся персональные рекомендации." />
        )}
        <View style={styles.privacyNote}><PackageCheck size={15} color={colors.textSecondary} /><Text style={styles.privacyText}>Расчёты выполняются на вашем устройстве</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Donut({ stats }: { stats: ReturnType<typeof getAnalytics>['categoryStats'] }) {
  const radius = 49;
  const circumference = 2 * Math.PI * radius;
  const segments = stats.map((item, index) => ({
    ...item,
    offset: stats.slice(0, index).reduce((total, previous) => total + previous.share * circumference, 0),
  }));
  return (
    <Svg width={130} height={130} viewBox="0 0 130 130">
      <Circle cx={65} cy={65} r={radius} fill="none" stroke={colors.surfaceMuted} strokeWidth={15} />
      {segments.map((item) => {
        const length = Math.max(0, item.share * circumference - 2);
        return <Circle key={item.category} cx={65} cy={65} r={radius} fill="none" stroke={item.color} strokeWidth={15} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={circumference / 4 - item.offset} />;
      })}
    </Svg>
  );
}

function LinearInsight({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.insight}>
      <View style={styles.insightIcon}><Sparkles size={20} color={colors.green} /></View>
      <View style={{ flex: 1 }}><Text style={styles.insightTitle}>{title}</Text><Text style={styles.insightText}>{text}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 118 },
  monthSwitcher: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 15, padding: 5, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  monthArrow: { width: 35, height: 32, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  chartCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 8, letterSpacing: 1.1, color: colors.textSecondary, marginBottom: 7 },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  total: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.ink, letterSpacing: -1 },
  totalUnit: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, marginRight: 5 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 4 },
  changeText: { fontFamily: fonts.bold, fontSize: 9 },
  legend: { gap: 7, paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontFamily: fonts.medium, fontSize: 8, color: colors.textSecondary },
  bars: { height: 183, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  barGroup: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barValueArea: { height: 21 },
  barValue: { fontFamily: fonts.bold, fontSize: 10, color: colors.ink },
  barTrack: { height: 133, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  bar: { width: 17, borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 0 },
  barLabel: { fontFamily: fonts.medium, fontSize: 9, color: colors.textSecondary, marginTop: 8, marginBottom: 9 },
  barLabelActive: { color: colors.ink, fontFamily: fonts.bold },
  chartFooter: { marginTop: 13, gap: 3 },
  chartFooterText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.text },
  chartFooterMuted: { fontFamily: fonts.regular, fontSize: 9, color: colors.textTertiary },
  metricsRow: { flexDirection: 'row', gap: 11, marginTop: 12 },
  metricCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 21, padding: 16, borderWidth: 1, borderColor: colors.border },
  metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  metricLabel: { fontFamily: fonts.medium, fontSize: 10, color: colors.textSecondary, marginBottom: 4 },
  metricValue: { fontFamily: fonts.extrabold, fontSize: 19, color: colors.ink, letterSpacing: -0.5 },
  metricUnit: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary },
  metricHint: { fontFamily: fonts.regular, fontSize: 8, color: colors.textTertiary, marginTop: 5 },
  categoryCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  sectionSubtitle: { fontFamily: fonts.regular, fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  categoryContent: { flexDirection: 'row', alignItems: 'center', marginTop: 22, gap: 20 },
  donutWrap: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutValue: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.ink },
  donutLabel: { fontFamily: fonts.medium, fontSize: 8, color: colors.textSecondary },
  categoryLegend: { flex: 1, gap: 13 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  categoryDot: { width: 7, height: 7, borderRadius: 4 },
  categoryName: { flex: 1, fontFamily: fonts.medium, fontSize: 9, color: colors.text },
  categoryPercent: { fontFamily: fonts.bold, fontSize: 10, color: colors.ink },
  noData: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 24, marginBottom: 10 },
  insight: { flexDirection: 'row', gap: 12, padding: 17, borderRadius: 21, backgroundColor: colors.greenMuted, marginTop: 12 },
  insightIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink, marginBottom: 5 },
  insightText: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 16, color: colors.green },
  privacyNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  privacyText: { fontFamily: fonts.medium, fontSize: 9, color: colors.textSecondary },
});
