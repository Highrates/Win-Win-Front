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
