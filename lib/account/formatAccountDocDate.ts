const WEEKDAYS = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
] as const;

const MONTHS_GEN = [
  'Января',
  'Февраля',
  'Марта',
  'Апреля',
  'Мая',
  'Июня',
  'Июля',
  'Августа',
  'Сентября',
  'Октября',
  'Ноября',
  'Декабря',
] as const;

/** «Четверг, 20 Июня, 2026» из `YYYY-MM-DD`. */
export function formatAccountDocDateHeader(dateISO: string): string {
  const [ys, ms, ds] = dateISO.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!y || !m || !d) return dateISO;
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAYS[date.getDay()];
  const monthName = MONTHS_GEN[m - 1] ?? '';
  return `${weekday}, ${d} ${monthName}, ${y}`;
}
