import { adminBackendJson } from '@/lib/adminBackendFetch';
import { rangeToQuery, type DashboardDateRange } from './dashboardPeriod';

export type OrdersDashboardSummary = {
  new: number;
  active: number;
};

export type SourcingDashboardSummary = {
  pendingReview: number;
  inProgress: number;
};

export type SignupDashboardSummary = { new: number };
export type PartnersDashboardSummary = { new: number };
export type QaUnreadSummary = { total: number };

export type OrdersChatUnreadSummary = {
  total: number;
  new: number;
  active: number;
  completed: number;
};

function withRange(path: string, range: DashboardDateRange): string {
  const q = rangeToQuery(range);
  const sp = new URLSearchParams({ from: q.from, to: q.to });
  return `${path}?${sp.toString()}`;
}

export async function fetchOrdersDashboardSummary(
  range: DashboardDateRange,
): Promise<OrdersDashboardSummary> {
  return adminBackendJson<OrdersDashboardSummary>(
    withRange('orders/admin/dashboard-status-summary', range),
  );
}

export async function fetchSourcingDashboardSummary(
  range: DashboardDateRange,
): Promise<SourcingDashboardSummary> {
  return adminBackendJson<SourcingDashboardSummary>(
    withRange('sourcing-requests/admin/dashboard-status-summary', range),
  );
}

export async function fetchSignupDashboardSummary(
  range: DashboardDateRange,
): Promise<SignupDashboardSummary> {
  return adminBackendJson<SignupDashboardSummary>(withRange('users/admin/signup-summary', range));
}

export async function fetchPartnersDashboardSummary(
  range: DashboardDateRange,
): Promise<PartnersDashboardSummary> {
  return adminBackendJson<PartnersDashboardSummary>(
    withRange('users/admin/partners-summary', range),
  );
}

export async function fetchQaUnreadSummary(range: DashboardDateRange): Promise<QaUnreadSummary> {
  return adminBackendJson<QaUnreadSummary>(withRange('catalog/admin/qa/unread-summary', range));
}

/** Текущие непрочитанные сообщения клиентов в чатах заказов (не привязано к периоду дашборда). */
export async function fetchOrdersChatUnreadSummary(): Promise<OrdersChatUnreadSummary> {
  return adminBackendJson<OrdersChatUnreadSummary>('orders/admin/chat-unread-summary');
}

export type CatalogDashboardSummary = {
  noModifications: number;
  noVariants: number;
  activeEmpty: number;
  elementEmptyPool: number;
  compositeIncomplete: number;
};

/** Гигиена карточек (модификации / элементы) — без привязки к периоду. */
export async function fetchCatalogDashboardSummary(): Promise<CatalogDashboardSummary> {
  return adminBackendJson<CatalogDashboardSummary>('catalog/admin/dashboard-catalog-summary');
}
