export type DashboardPeriodPreset = 'today' | 'month' | 'custom';

export type DashboardDateRange = {
  from: Date;
  to: Date;
};

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Inclusive calendar days → [from start, to+1 day start). */
export function rangeFromInclusiveDays(fromDay: Date, toDay: Date): DashboardDateRange {
  const from = startOfLocalDay(fromDay);
  const toExclusive = startOfLocalDay(toDay);
  toExclusive.setDate(toExclusive.getDate() + 1);
  return { from, to: toExclusive };
}

export function rangeForPreset(preset: 'today' | 'month'): DashboardDateRange {
  const now = new Date();
  if (preset === 'today') {
    return rangeFromInclusiveDays(now, now);
  }
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return rangeFromInclusiveDays(monthStart, now);
}

/** Значение для `<input type="date">` в локальной зоне. */
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateInputValue(raw: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

export function rangeToQuery(range: DashboardDateRange): { from: string; to: string } {
  return { from: range.from.toISOString(), to: range.to.toISOString() };
}
