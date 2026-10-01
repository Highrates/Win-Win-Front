import { describe, expect, it } from 'vitest';
import {
  filterPartnerLinesByPeriod,
  formatPartnerPeriodChipLabel,
  partnerPeriodForPreset,
  partnerPeriodFromInclusiveYmd,
} from './partnerReportPeriod';
import type { PartnerProgramBonusLineApi } from '@/lib/referrals/partnerProgramSummary';

function line(iso: string): PartnerProgramBonusLineApi {
  return {
    orderId: 'o1',
    orderUpdatedAt: iso,
    catalogTotalRub: '1000',
    purchaserUserId: 'u1',
    tier: 1,
    percentApplied: 5,
    bonusRub: '50',
    orderStatus: 'COMPLETED',
    pipeline: false,
    source: 'REFERRAL',
  };
}

describe('partnerReportPeriod', () => {
  it('builds 1-month preset ending today', () => {
    const now = new Date(2026, 9, 1); // 1 Oct 2026
    const p = partnerPeriodForPreset(0, now);
    expect(p.label).toMatch(/сен|окт/);
    expect(filterPartnerLinesByPeriod([line('2026-09-15T12:00:00.000Z')], p)).toHaveLength(1);
    expect(filterPartnerLinesByPeriod([line('2025-01-01T12:00:00.000Z')], p)).toHaveLength(0);
  });

  it('accepts custom inclusive ymd range', () => {
    const p = partnerPeriodFromInclusiveYmd('2026-01-10', '2026-01-20');
    expect(p).not.toBeNull();
    expect(formatPartnerPeriodChipLabel(p!.from, new Date(2026, 0, 20))).toMatch(/янв/);
    expect(filterPartnerLinesByPeriod([line('2026-01-15T10:00:00.000Z')], p!)).toHaveLength(1);
    expect(filterPartnerLinesByPeriod([line('2026-01-21T10:00:00.000Z')], p!)).toHaveLength(0);
  });

  it('rejects inverted custom range', () => {
    expect(partnerPeriodFromInclusiveYmd('2026-02-01', '2026-01-01')).toBeNull();
  });
});
