import { categories } from '@/data/catalog';
import type { CategoryId, InventoryEvent } from '@/types/inventory';
import { monthKey } from '@/utils/date';

export interface CategoryStat {
  category: CategoryId;
  value: number;
  share: number;
  color: string;
}

export function getAnalytics(events: InventoryEvent[], month: Date) {
  const key = monthKey(month);
  const previous = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const currentEvents = events.filter((event) => event.date.startsWith(key));
  const previousEvents = events.filter((event) => event.date.startsWith(monthKey(previous)));
  const consumedEvents = currentEvents.filter((event) => event.type === 'consumed');
  const wastedEvents = currentEvents.filter((event) => event.type === 'wasted');
  const sum = (items: InventoryEvent[]) => items.reduce((total, event) => total + event.quantity, 0);
  const consumed = sum(consumedEvents);
  const previousConsumed = sum(previousEvents.filter((event) => event.type === 'consumed'));
  const spent = currentEvents.filter((event) => event.type === 'added').reduce((total, event) => total + event.value, 0);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const ranges = [[1, 7], [8, 14], [15, 21], [22, daysInMonth]];
  const weeks = ranges.map(([start, end]) => ({
    label: `${start}–${end}`,
    consumed: sum(consumedEvents.filter((event) => Number(event.date.slice(8, 10)) >= start && Number(event.date.slice(8, 10)) <= end)),
    wasted: sum(wastedEvents.filter((event) => Number(event.date.slice(8, 10)) >= start && Number(event.date.slice(8, 10)) <= end)),
  }));
  const categoryTotals = consumedEvents.reduce<Partial<Record<CategoryId, number>>>((result, event) => {
    result[event.category] = (result[event.category] ?? 0) + event.quantity;
    return result;
  }, {});
  const categoryStats = (Object.entries(categoryTotals) as [CategoryId, number][])
    .map(([category, value]) => ({ category, value, share: consumed ? value / consumed : 0, color: categories[category].color }))
    .sort((a, b) => b.value - a.value);
  const topCategory = categoryStats[0];

  return {
    currentEvents,
    consumedEvents,
    consumed,
    previousConsumed,
    consumptionChange: previousConsumed ? ((consumed - previousConsumed) / previousConsumed) * 100 : 0,
    spent,
    wasted: sum(wastedEvents),
    weeks,
    categoryStats,
    topCategory,
  };
}
