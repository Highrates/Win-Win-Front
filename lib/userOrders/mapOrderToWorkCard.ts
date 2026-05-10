import type { AccountOrderWorkCardProps } from '@/components/AccountOrders/AccountOrderWorkCard';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import type { UserOrderListItemApi } from './types';

const PLACEHOLDER = '/images/placeholder.svg';

const IN_WORK_STATUSES = new Set(['PENDING_APPROVAL', 'ORDERED', 'PAID']);

function orderItemThumb(item: UserOrderListItemApi['items'][number]): string {
  const s = item.snapshot && typeof item.snapshot === 'object' ? (item.snapshot as Record<string, unknown>) : null;
  if (s && typeof s.imageUrl === 'string' && s.imageUrl.trim()) return s.imageUrl.trim();
  const u = item.product?.images?.[0]?.url;
  if (typeof u === 'string' && u.trim()) return u.trim();
  return PLACEHOLDER;
}

function statusLabelRu(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'На согласовании';
    case 'ORDERED':
      return 'Заказано';
    case 'PAID':
      return 'Оплачено';
    case 'RECEIVED':
      return 'Получено';
    default:
      return 'В работе';
  }
}

function formatOrderDate(iso: string): string {
  try {
    const d = new Date(iso);
    const datePart = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
    return `Заказ от ${datePart}`;
  } catch {
    return 'Заказ';
  }
}

function formatTotalRub(amount: string | number, currency: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency || 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Заказы для вкладки «В работе» (не черновик, не завершён). */
export function filterInWorkOrders(orders: UserOrderListItemApi[]): UserOrderListItemApi[] {
  return orders.filter((o) => IN_WORK_STATUSES.has(o.status));
}

/** Самые свежие по `createdAt` — первыми в списке. */
export function sortUserOrdersByCreatedDesc(orders: UserOrderListItemApi[]): UserOrderListItemApi[] {
  return [...orders].sort((a, b) => {
    const ta = Date.parse(a.createdAt);
    const tb = Date.parse(b.createdAt);
    const na = Number.isFinite(ta) ? ta : 0;
    const nb = Number.isFinite(tb) ? tb : 0;
    return nb - na;
  });
}

export function mapUserOrderToWorkCard(
  order: UserOrderListItemApi,
  opts?: { onOpenDetails?: () => void },
): AccountOrderWorkCardProps {
  const thumbs = order.items.map(orderItemThumb).filter(Boolean);
  const skuCount = order.items.length;
  const shortNo = formatOrderDisplayId(order.id);

  const sumLabel = order.status === 'PENDING_APPROVAL' ? 'Ожидаемая сумма заказа' : 'Сумма';

  return {
    statusLabel: statusLabelRu(order.status),
    dateLine: formatOrderDate(order.createdAt),
    metaRows: [
      { label: 'Номер', value: shortNo, valueTitle: order.id },
      { label: 'Позиций', value: String(skuCount) },
      { label: sumLabel, value: formatTotalRub(order.totalAmount, order.currency) },
    ],
    productThumbSrcs: thumbs.length ? thumbs : [PLACEHOLDER],
    onOpenDetails: opts?.onOpenDetails,
    detailHref: opts?.onOpenDetails ? undefined : `/account/orders/${order.id}`,
    ctaCount: 1,
  };
}
