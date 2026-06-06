import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';

export type PartnerProgramBonusLineApi = {
  orderId: string;
  orderUpdatedAt: string;
  catalogTotalRub: string;
  purchaserUserId: string;
  tier: 1 | 2;
  percentApplied: number;
  bonusRub: string;
  orderStatus: string;
  pipeline: boolean;
  source?: 'REFERRAL' | 'OWN_ORDER';
};

export type PartnerProgramSummaryApi = {
  program: {
    enabled: boolean;
    level1Percent: number;
    level2Percent: number;
    minimumOrderSiteTotalRub: number;
    basisNote: string;
  };
  totals: {
    personalPipelineRub: string;
    personalCompletedRub: string;
    teamPipelineRub: string;
    teamCompletedRub: string;
    payableFromCompletedRub: string;
    pipelineOutlookRub: string;
  };
  personalLines: PartnerProgramBonusLineApi[];
  teamLines: PartnerProgramBonusLineApi[];
};

function parseMoneyToNumber(raw: string): number {
  const n = parseFloat(String(raw ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** ₽ без копеек для сумм партнёрской программы в ЛК. */
export function formatPartnerRubWhole(rawRub: string | number): string {
  const n = typeof rawRub === 'string' ? parseMoneyToNumber(rawRub) : rawRub;
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(n));
}

export function formatPartnerTableDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  } catch {
    return '—';
  }
}

/** Заказы с реферальным доходом: только после «Завершен» сумма попадает в completed totals; строки в таблице — завершённые. */
export function filterCompletedPartnerLines(lines: PartnerProgramBonusLineApi[]): PartnerProgramBonusLineApi[] {
  return lines.filter((l) => !l.pipeline);
}

export function partnerLineOrderLabel(line: PartnerProgramBonusLineApi): string {
  return formatOrderDisplayId(line.orderId);
}

export async function fetchPartnerProgramSummary(): Promise<PartnerProgramSummaryApi | null> {
  const res = await fetch('/api/user/referrals/partner-program/summary', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (res.status === 403) return null;
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res));
  }
  return (await res.json()) as PartnerProgramSummaryApi;
}
