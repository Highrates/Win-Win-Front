import { describe, expect, it } from 'vitest';
import {
  buildAssistantInsights,
  buildDashboardPeriodCopy,
} from '@/lib/admin-i18n/adminDashboardInsightsI18n';
import {
  catalogHasHygieneHole,
  EMPTY_DASHBOARD_DATA,
  kpiDisplay,
  type DashboardData,
} from '@/lib/adminDashboard/dashboardData';

describe('kpiDisplay', () => {
  it('shows ellipsis while busy', () => {
    expect(kpiDisplay(true, 3)).toBe('…');
  });

  it('shows em dash when missing after load', () => {
    expect(kpiDisplay(false, null)).toBe('—');
    expect(kpiDisplay(false, undefined)).toBe('—');
  });

  it('shows number when present', () => {
    expect(kpiDisplay(false, 0)).toBe('0');
    expect(kpiDisplay(false, 12)).toBe('12');
  });
});

describe('catalogHasHygieneHole', () => {
  it('is false when all zero', () => {
    expect(
      catalogHasHygieneHole({
        noModifications: 0,
        noVariants: 0,
        activeEmpty: 0,
        elementEmptyPool: 0,
        compositeIncomplete: 0,
      }),
    ).toBe(false);
  });

  it('is true for any positive disjoint bucket without summing', () => {
    expect(
      catalogHasHygieneHole({
        noModifications: 0,
        noVariants: 0,
        activeEmpty: 9,
        elementEmptyPool: 2,
        compositeIncomplete: 0,
      }),
    ).toBe(true);
  });

  it('ignores overlapping activeEmpty rollup alone', () => {
    expect(
      catalogHasHygieneHole({
        noModifications: 0,
        noVariants: 0,
        activeEmpty: 5,
        elementEmptyPool: 0,
        compositeIncomplete: 0,
      }),
    ).toBe(false);
  });
});

describe('buildDashboardPeriodCopy', () => {
  it('avoids За за / За в этом месяце', () => {
    expect(buildDashboardPeriodCopy('today', 'ru', '2026-09-02', '2026-09-02')).toEqual({
      paren: 'сегодня',
      emptyPrefix: 'За сегодня',
    });
    expect(buildDashboardPeriodCopy('month', 'ru', '2026-09-01', '2026-09-02')).toEqual({
      paren: 'в этом месяце',
      emptyPrefix: 'В этом месяце',
    });
    const custom = buildDashboardPeriodCopy('custom', 'ru', '2026-09-01', '2026-09-07');
    expect(custom.emptyPrefix.startsWith('За ')).toBe(true);
    expect(custom.emptyPrefix.includes('За за')).toBe(false);
    expect(custom.paren).toBe('01.09.2026 – 07.09.2026');
  });
});

describe('buildAssistantInsights', () => {
  const period = buildDashboardPeriodCopy('today', 'ru', '2026-09-02', '2026-09-02');

  it('returns empty while loading', () => {
    expect(buildAssistantInsights(EMPTY_DASHBOARD_DATA, true, 'ru', period)).toEqual([]);
  });

  it('shows load-failed when nothing loaded', () => {
    const items = buildAssistantInsights(EMPTY_DASHBOARD_DATA, false, 'ru', period);
    expect(items).toHaveLength(1);
    expect(items[0]?.icon).toBe('⚠️');
  });

  it('mentions pending orders with period paren', () => {
    const data: DashboardData = {
      ...EMPTY_DASHBOARD_DATA,
      orders: { new: 2, active: 0 },
    };
    const items = buildAssistantInsights(data, false, 'ru', period);
    expect(items[0]?.text).toContain('2');
    expect(items[0]?.text).toContain('сегодня');
  });

  it('flags catalog hygiene without requiring a numeric sum', () => {
    const data: DashboardData = {
      ...EMPTY_DASHBOARD_DATA,
      orders: { new: 0, active: 0 },
      catalog: {
        noModifications: 1,
        noVariants: 1,
        activeEmpty: 1,
        elementEmptyPool: 0,
        compositeIncomplete: 0,
      },
    };
    const items = buildAssistantInsights(data, false, 'ru', period);
    expect(items.some((i) => i.icon === '🗂')).toBe(true);
  });
});
