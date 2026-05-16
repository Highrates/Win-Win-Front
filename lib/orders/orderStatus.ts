/** Коды статусов заказа (Prisma `OrderStatus`). Порядок — жизненный цикл после отправки из ЛК. */
export const ORDER_STATUS_FLOW = [
  'PENDING_APPROVAL',
  'PROPOSAL_FORMED',
  'APPROVED',
  'PENDING_SIGNATURE',
  'PENDING_PAYMENT',
  'PAID',
  'PENDING_SHIPMENT',
  'IN_TRANSIT',
  'DELIVERED_TO_RU_WAREHOUSE',
  'RECEIVED',
  'COMPLETED',
] as const;

export type OrderStatusFlow = (typeof ORDER_STATUS_FLOW)[number];

export const ORDER_STATUS_DRAFT = 'DRAFT' as const;

export type OrderStatusCode = OrderStatusFlow | typeof ORDER_STATUS_DRAFT;

const LABELS_RU: Record<OrderStatusCode, string> = {
  DRAFT: 'Черновик',
  PENDING_APPROVAL: 'На согласовании',
  PROPOSAL_FORMED: 'Предложение сформировано',
  APPROVED: 'Согласовано',
  PENDING_SIGNATURE: 'Ожидает подписи',
  PENDING_PAYMENT: 'Ожидает оплаты',
  PAID: 'Оплачено',
  PENDING_SHIPMENT: 'Ожидает отгрузки',
  IN_TRANSIT: 'В пути',
  DELIVERED_TO_RU_WAREHOUSE: 'Доставлен на склад в РФ',
  RECEIVED: 'Получено',
  COMPLETED: 'Завершен',
};

const LABELS_ZH: Record<OrderStatusCode, string> = {
  DRAFT: '草稿',
  PENDING_APPROVAL: '待审批',
  PROPOSAL_FORMED: '方案已生成',
  APPROVED: '已批准',
  PENDING_SIGNATURE: '待签署',
  PENDING_PAYMENT: '待付款',
  PAID: '已付款',
  PENDING_SHIPMENT: '待发货',
  IN_TRANSIT: '运输中',
  DELIVERED_TO_RU_WAREHOUSE: '已送达俄罗斯仓库',
  RECEIVED: '已收货',
  COMPLETED: '已完成',
};

export function orderStatusLabel(status: string, locale: 'ru' | 'zh' = 'ru'): string {
  const map = locale === 'zh' ? LABELS_ZH : LABELS_RU;
  const key = status as OrderStatusCode;
  return map[key] ?? status;
}

/** Вкладка «В работе» в ЛК: не черновик и не завершён. */
export const CUSTOMER_IN_WORK_STATUSES = new Set<string>(ORDER_STATUS_FLOW.filter((s) => s !== 'COMPLETED'));

/** Админка: заказы в работе (после согласования, до завершения). */
export const ADMIN_ACTIVE_STATUSES: readonly OrderStatusFlow[] = ORDER_STATUS_FLOW.filter(
  (s) => s !== 'PENDING_APPROVAL' && s !== 'COMPLETED' && s !== 'RECEIVED',
);

export const ADMIN_COMPLETED_STATUSES: readonly OrderStatusFlow[] = ['RECEIVED', 'COMPLETED'];
