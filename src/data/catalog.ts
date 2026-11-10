import type { CategoryId, InventoryState, LocationId, Unit } from '@/types/inventory';

export const categories: Record<CategoryId, { name: string; shortName: string; color: string; background: string }> = {
  dairy: { name: 'Молочные продукты', shortName: 'Молочное', color: '#668B9D', background: '#E6F0F3' },
  produce: { name: 'Овощи и фрукты', shortName: 'Овощи и фрукты', color: '#648553', background: '#EAF1DF' },
  meat: { name: 'Мясо и рыба', shortName: 'Мясо и рыба', color: '#B56D62', background: '#F6E7E2' },
  frozen: { name: 'Заморозка', shortName: 'Заморозка', color: '#7186AE', background: '#E8EDF6' },
  pantry: { name: 'Бакалея', shortName: 'Бакалея', color: '#9B7B4D', background: '#F3ECDD' },
  drinks: { name: 'Напитки', shortName: 'Напитки', color: '#8A6C91', background: '#F0E8F1' },
  bakery: { name: 'Хлеб и выпечка', shortName: 'Выпечка', color: '#B4834F', background: '#F8EDDE' },
  other: { name: 'Другое', shortName: 'Другое', color: '#778078', background: '#ECEFEA' },
};

export const locations: Record<LocationId, { name: string; description: string }> = {
  fridge: { name: 'Холодильник', description: 'Свежие продукты' },
  freezer: { name: 'Морозилка', description: 'Длительное хранение' },
  pantry: { name: 'Кладовая', description: 'Бакалея и напитки' },
};

export const units: Unit[] = ['шт', 'кг', 'г', 'л', 'мл', 'уп'];

export function createEmptyState(): InventoryState {
  return { products: [], events: [], shopping: [] };
}
