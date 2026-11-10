export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysAgo(days: number) {
  return toISODate(addDays(new Date(), -days));
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function daysUntil(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const today = parseISODate(toISODate(new Date()));
  return Math.round((parseISODate(value).getTime() - today.getTime()) / 86400000);
}

export function formatShortDate(value: string | null) {
  if (!value) return 'Без срока';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
    .format(parseISODate(value))
    .replace('.', '');
}

export function expiryLabel(value: string | null) {
  const days = daysUntil(value);
  if (!Number.isFinite(days)) return 'Срок не указан';
  if (days < 0) return 'Срок истёк';
  if (days === 0) return 'Истекает сегодня';
  if (days === 1) return 'Истекает завтра';
  return `Истекает через ${days} ${plural(days, ['день', 'дня', 'дней'])}`;
}

export function formatInputDate(value: string | null) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

export function parseInputDate(value: string) {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return toISODate(date);
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonth(date: Date) {
  const value = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(date);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function plural(value: number, forms: [string, string, string]) {
  const number = Math.abs(Math.round(value));
  const mod100 = number % 100;
  const mod10 = number % 10;
  if (mod100 > 10 && mod100 < 20) return forms[2];
  if (mod10 > 1 && mod10 < 5) return forms[1];
  if (mod10 === 1) return forms[0];
  return forms[2];
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}

export function formatMoney(value: number) {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)} ₽`;
}
