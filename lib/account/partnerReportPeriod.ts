import type { PartnerProgramBonusLineApi } from '@/lib/referrals/partnerProgramSummary';
import {
  parseDateInputValue,
  rangeFromInclusiveDays,
  toDateInputValue,
} from '@/lib/adminDashboard/dashboardPeriod';

export const PARTNER_REPORT_RANGE_TABS = ['1 мес', '3 мес', '6 мес', 'За все время'] as const;

export type PartnerReportRangePreset = 0 | 1 | 2 | 3;

export type PartnerReportPeriod = {
  /** Inclusive calendar day start. */
  from: Date;
  /** Exclusive end (start of day after last inclusive day). */
  toExclusive: Date;
  /** Short label for the period chip / PDF header. */
  label: string;
};

const MONTHS_SHORT_RU = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDayMonthRu(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT_RU[d.getMonth()]}`;
}

/** «26 янв - 26 фев.» / «1 янв - 31 дек. 2025» */
export function formatPartnerPeriodChipLabel(fromInclusive: Date, toInclusive: Date): string {
  const sameYear = fromInclusive.getFullYear() === toInclusive.getFullYear();
  const left = formatDayMonthRu(fromInclusive);
  const right = formatDayMonthRu(toInclusive);
  if (sameYear) return `${left} - ${right}.`;
  return `${left} ${fromInclusive.getFullYear()} - ${right} ${toInclusive.getFullYear()}`;
}

export function lastInclusiveDay(toExclusive: Date): Date {
  const d = startOfLocalDay(toExclusive);
  d.setDate(d.getDate() - 1);
  return d;
}

export function partnerPeriodForPreset(
  preset: PartnerReportRangePreset,
  now = new Date(),
): PartnerReportPeriod {
  const endInclusive = startOfLocalDay(now);
  if (preset === 3) {
    const from = new Date(2000, 0, 1);
    const { from: f, to } = rangeFromInclusiveDays(from, endInclusive);
    return { from: f, toExclusive: to, label: 'За все время' };
  }
  const months = preset === 0 ? 1 : preset === 1 ? 3 : 6;
  const fromInclusive = startOfLocalDay(now);
  fromInclusive.setMonth(fromInclusive.getMonth() - months);
  const { from, to } = rangeFromInclusiveDays(fromInclusive, endInclusive);
  return {
    from,
    toExclusive: to,
    label: formatPartnerPeriodChipLabel(fromInclusive, endInclusive),
  };
}

export function partnerPeriodFromInclusiveYmd(
  fromYmd: string,
  toYmd: string,
): PartnerReportPeriod | null {
  const fromDay = parseDateInputValue(fromYmd);
  const toDay = parseDateInputValue(toYmd);
  if (!fromDay || !toDay) return null;
  if (fromDay.getTime() > toDay.getTime()) return null;
  const { from, to } = rangeFromInclusiveDays(fromDay, toDay);
  return {
    from,
    toExclusive: to,
    label: formatPartnerPeriodChipLabel(fromDay, toDay),
  };
}

export function filterPartnerLinesByPeriod(
  lines: PartnerProgramBonusLineApi[],
  period: PartnerReportPeriod,
): PartnerProgramBonusLineApi[] {
  const fromMs = period.from.getTime();
  const toMs = period.toExclusive.getTime();
  return lines.filter((line) => {
    const t = new Date(line.orderUpdatedAt).getTime();
    if (!Number.isFinite(t)) return false;
    return t >= fromMs && t < toMs;
  });
}

export function defaultCustomRangeYmd(now = new Date()): { fromYmd: string; toYmd: string } {
  const to = startOfLocalDay(now);
  const from = startOfLocalDay(now);
  from.setMonth(from.getMonth() - 1);
  return { fromYmd: toDateInputValue(from), toYmd: toDateInputValue(to) };
}
