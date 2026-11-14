/** Клиент-безопасные хелперы дат туров (без server fetch). */

export function formatTourDateChip(startsAt: string, endsAt: string): string {
  try {
    const s = new Date(startsAt);
    const e = new Date(endsAt);
    const parts = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).formatToParts(e);
    const month = (parts.find((p) => p.type === 'month')?.value ?? '').toUpperCase();
    return `${s.getDate()} - ${e.getDate()} ${month}`;
  } catch {
    return '';
  }
}

export function formatTourDateRange(startsAt: string, endsAt: string): string {
  return formatTourDateChip(startsAt, endsAt);
}
