import type { Product, Unit } from '@/types/inventory';
import { daysUntil } from '@/utils/date';

export function quantityStep(unit: Unit) {
  if (unit === 'кг' || unit === 'л') return 0.1;
  if (unit === 'г') return 50;
  if (unit === 'мл') return 100;
  return 1;
}

export function isLowStock(product: Product) {
  return product.quantity <= product.minQuantity;
}

export function needsAttention(product: Product) {
  return daysUntil(product.expiresAt) <= 3 || isLowStock(product);
}
