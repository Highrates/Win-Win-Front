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
