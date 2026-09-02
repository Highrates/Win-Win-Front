import type {
  CatalogDashboardSummary,
  OrdersChatUnreadSummary,
  OrdersDashboardSummary,
  PartnersDashboardSummary,
  SignupDashboardSummary,
  SourcingDashboardSummary,
} from './adminDashboardApi';

export type DashboardData = {
  orders: OrdersDashboardSummary | null;
  sourcing: SourcingDashboardSummary | null;
  qaUnread: number | null;
  ordersChat: OrdersChatUnreadSummary | null;
  partners: PartnersDashboardSummary | null;
  signups: SignupDashboardSummary | null;
  catalog: CatalogDashboardSummary | null;
};

export const EMPTY_DASHBOARD_DATA: DashboardData = {
  orders: null,
  sourcing: null,
  qaUnread: null,
  ordersChat: null,
  partners: null,
  signups: null,
  catalog: null,
};

export function kpiDisplay(busy: boolean, value: number | null | undefined): string {
  if (busy) return '…';
  if (value == null) return '—';
  return String(value);
}

/**
 * Любая гигиена-дыра по взаимно исключающим бакетам (без суммирования и без rollup `activeEmpty`).
 */
export function catalogHasHygieneHole(catalog: CatalogDashboardSummary): boolean {
  return (
    catalog.noModifications > 0 ||
    catalog.noVariants > 0 ||
    catalog.elementEmptyPool > 0 ||
    catalog.compositeIncomplete > 0
  );
}
