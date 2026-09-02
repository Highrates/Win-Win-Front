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

function formatYmdRu(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  if (!y || !m || !d) return ymd;
  return `${d}.${m}.${y}`;
}

/** Диапазон для чипа / инсайтов: `01.09.2026` или `01.09 – 07.09.2026`. */
export function formatPeriodRange(fromYmd: string, toYmd: string): string {
  if (fromYmd === toYmd) return formatYmdRu(fromYmd);
  return `${formatYmdRu(fromYmd)} – ${formatYmdRu(toYmd)}`;
}

export function startOfCompare(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** from/to из URL списка (как в дашборде); оба или ничего. */
export function periodParamsFromSearch(get: (key: string) => string | null): {
  from?: string;
  to?: string;
} {
  const from = get('from')?.trim() || undefined;
  const to = get('to')?.trim() || undefined;
  if (!from || !to) return {};
  return { from, to };
}

/** Deep-link с периода дашборда + доп. query. */
export function hrefWithDashboardPeriod(
  path: string,
  range: DashboardDateRange,
  extra?: Record<string, string | undefined>,
): string {
  const q = rangeToQuery(range);
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(extra ?? {})) {
    if (v != null && v !== '') sp.set(k, v);
  }
  sp.set('from', q.from);
  sp.set('to', q.to);
  return `${path}?${sp.toString()}`;
}

/** Сохранить from/to при смене bucket/section на странице списка. */
export function hrefPreservingPeriod(
  path: string,
  searchParams: { get(name: string): string | null },
  extra: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(extra)) {
    if (v != null && v !== '') sp.set(k, v);
  }
  const { from, to } = periodParamsFromSearch((k) => searchParams.get(k));
  if (from && to) {
    sp.set('from', from);
    sp.set('to', to);
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}
