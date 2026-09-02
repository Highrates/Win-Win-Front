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

function withSignal(signal?: AbortSignal): RequestInit | undefined {
  return signal ? { signal } : undefined;
}

export async function fetchOrdersDashboardSummary(
  range: DashboardDateRange,
  signal?: AbortSignal,
): Promise<OrdersDashboardSummary> {
  return adminBackendJson<OrdersDashboardSummary>(
    withRange('orders/admin/dashboard-status-summary', range),
    withSignal(signal),
  );
}

export async function fetchSourcingDashboardSummary(
  range: DashboardDateRange,
  signal?: AbortSignal,
): Promise<SourcingDashboardSummary> {
  return adminBackendJson<SourcingDashboardSummary>(
    withRange('sourcing-requests/admin/dashboard-status-summary', range),
    withSignal(signal),
  );
}

export async function fetchSignupDashboardSummary(
  range: DashboardDateRange,
  signal?: AbortSignal,
): Promise<SignupDashboardSummary> {
  return adminBackendJson<SignupDashboardSummary>(
    withRange('users/admin/signup-summary', range),
    withSignal(signal),
  );
}

export async function fetchPartnersDashboardSummary(
  range: DashboardDateRange,
  signal?: AbortSignal,
): Promise<PartnersDashboardSummary> {
  return adminBackendJson<PartnersDashboardSummary>(
    withRange('users/admin/partners-summary', range),
    withSignal(signal),
  );
}

/** Текущие непрочитанные Q&A (как очередь) — без привязки к периоду дашборда. */
export async function fetchQaUnreadSummary(signal?: AbortSignal): Promise<QaUnreadSummary> {
  return adminBackendJson<QaUnreadSummary>('catalog/admin/qa/unread-summary', withSignal(signal));
}

/** Текущие непрочитанные сообщения клиентов в чатах заказов (не привязано к периоду дашборда). */
export async function fetchOrdersChatUnreadSummary(
  signal?: AbortSignal,
): Promise<OrdersChatUnreadSummary> {
  return adminBackendJson<OrdersChatUnreadSummary>(
    'orders/admin/chat-unread-summary',
    withSignal(signal),
  );
}

export type CatalogDashboardSummary = {
  noModifications: number;
  noVariants: number;
  /** Rollup для фильтра списка; пересекается с базовыми бакетами — не KPI дашборда. */
  activeEmpty: number;
  elementEmptyPool: number;
  compositeIncomplete: number;
};

/** Гигиена карточек (модификации / элементы) — без привязки к периоду. */
export async function fetchCatalogDashboardSummary(
  signal?: AbortSignal,
): Promise<CatalogDashboardSummary> {
  return adminBackendJson<CatalogDashboardSummary>(
    'catalog/admin/dashboard-catalog-summary',
    withSignal(signal),
  );
}
