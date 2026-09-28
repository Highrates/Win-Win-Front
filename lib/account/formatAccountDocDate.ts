const PARTS_FORMAT = new Intl.DateTimeFormat('ru', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function parseLocalDate(dateISO: string): Date | null {
  const [ys, ms, ds] = dateISO.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/**
 * Заголовок группы документов из `YYYY-MM-DD` (локальная дата):
 * «Сегодня», «Вчера», «Четверг, 20 июня» (текущий год), «Четверг, 20 июня 2025».
 */
export function formatAccountDocDateHeader(dateISO: string, now: Date = new Date()): string {
  const date = parseLocalDate(dateISO);
  if (!date) return dateISO;

  const diff = daysBetween(date, now);
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';

  const parts = PARTS_FORMAT.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = pick('weekday');
  const head = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${pick('day')} ${pick('month')}`;
  return date.getFullYear() === now.getFullYear() ? head : `${head} ${pick('year')}`;
}

const SHORT_FORMAT = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' });
const SHORT_FORMAT_YEAR = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric' });

/** Короткая дата для строки документа: «20 июня» / «20 июня 2025 г.» → без «г.». */
export function formatAccountDocShortDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  if (date.getFullYear() === now.getFullYear()) return SHORT_FORMAT.format(date);
  return SHORT_FORMAT_YEAR.format(date).replace(/\s*г\.$/, '');
}
