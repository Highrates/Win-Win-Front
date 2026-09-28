import { userScopeStatuses } from '@win-win/sourcing-request';
import { ORDER_STATUS_DRAFT } from '@/lib/orders/orderStatus';

/** После ack КП или чтения чата — обновить красные индикаторы в сайдбаре и на вкладке «В работе». */
export const ACCOUNT_WORK_NOTIFICATIONS_EVENT = 'winwin:account-work-notifications';

/** Перезагрузить списки заказов/заявок на вкладках «В работе» / «Завершённые». */
export const ACCOUNT_WORK_FEED_REFRESH_EVENT = 'winwin:account-work-feed-refresh';

export type AccountWorkNotificationsDetail = {
  entityId?: string;
  chatSubject?: 'order' | 'sourcing';
};

export function dispatchAccountWorkNotificationsEvent(detail?: AccountWorkNotificationsDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ACCOUNT_WORK_NOTIFICATIONS_EVENT, { detail }));
}

export function dispatchAccountWorkFeedRefreshEvent(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ACCOUNT_WORK_FEED_REFRESH_EVENT));
}

export const ORDER_TABS = ['Подготовка заказа', 'В работе', 'Завершенные'] as const;

/** Значения query `?tab=` на `/account/orders` — чтобы вкладка сохранялась при обновлении */
export const ORDER_TAB_QUERY_VALUES = ['preparation', 'work', 'completed'] as const;

export function orderTabIndexFromQuery(tab: string | null | undefined): number {
  if (tab == null || tab === '') return 0;
  const i = ORDER_TAB_QUERY_VALUES.indexOf(tab as (typeof ORDER_TAB_QUERY_VALUES)[number]);
  return i >= 0 ? i : 0;
}

/** Для URL: вкладка по умолчанию (подготовка) — без query; остальные — `?tab=work` / `completed` */
export function orderTabQueryParamForUrl(index: number): (typeof ORDER_TAB_QUERY_VALUES)[number] | null {
  if (index < 1 || index >= ORDER_TAB_QUERY_VALUES.length) return null;
  return ORDER_TAB_QUERY_VALUES[index] ?? null;
}

/** Deep-link на `/account/orders`: открыть модалку заказа / заявки на подбор, при `chat` — сразу чат. */
export type AccountOrdersDetailLink = {
  kind: 'order' | 'sourcing';
  id: string;
  chat: boolean;
  /** Текущий статус заказа / заявки: по нему выбирается вкладка под модалкой. */
  status?: string | null;
};

const SOURCING_COMPLETED_STATUSES = new Set<string>(userScopeStatuses('completed') ?? []);

/** Вкладка списка, в которой лежит заказ / заявка с этим статусом (как в scope списков ЛК). */
export function accountOrdersTabForStatus(
  kind: AccountOrdersDetailLink['kind'],
  status: string | null | undefined,
): (typeof ORDER_TAB_QUERY_VALUES)[number] {
  if (kind === 'sourcing') return status && SOURCING_COMPLETED_STATUSES.has(status) ? 'completed' : 'work';
  if (status === ORDER_STATUS_DRAFT) return 'preparation';
  if (status === 'COMPLETED') return 'completed';
  return 'work';
}

export function accountOrdersDetailHref(link: AccountOrdersDetailLink): string {
  const tab = accountOrdersTabForStatus(link.kind, link.status);
  const q = new URLSearchParams();
  if (tab !== 'preparation') q.set('tab', tab);
  q.set(link.kind, link.id);
  if (link.chat) q.set('chat', '1');
  return `/account/orders?${q.toString()}`;
}

export function accountOrdersDetailFromQuery(params: {
  order?: string | string[];
  sourcing?: string | string[];
  chat?: string | string[];
}): AccountOrdersDetailLink | null {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || '';
  const chat = first(params.chat) === '1';
  const order = first(params.order);
  if (order) return { kind: 'order', id: order, chat };
  const sourcing = first(params.sourcing);
  if (sourcing) return { kind: 'sourcing', id: sourcing, chat };
  return null;
}
