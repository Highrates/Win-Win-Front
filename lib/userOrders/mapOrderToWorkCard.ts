import type { AccountOrderWorkCardProps } from '@/components/AccountOrders/AccountOrderWorkCard';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import { CUSTOMER_IN_WORK_STATUSES, orderStatusLabel } from '@/lib/orders/orderStatus';
import type { UserOrderListItemApi } from './types';

const PLACEHOLDER = '/images/placeholder.svg';

function orderItemThumb(item: UserOrderListItemApi['items'][number]): string {
  const s = item.snapshot && typeof item.snapshot === 'object' ? (item.snapshot as Record<string, unknown>) : null;
  if (s && typeof s.imageUrl === 'string' && s.imageUrl.trim()) return s.imageUrl.trim();
  const u = item.product?.images?.[0]?.url;
  if (typeof u === 'string' && u.trim()) return u.trim();
  return PLACEHOLDER;
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
  return orders.filter((o) => CUSTOMER_IN_WORK_STATUSES.has(o.status));
}

/** Самые свежие по `updatedAt` — первыми в списке (fallback на `createdAt`). */
export function sortUserOrdersByUpdatedDesc(orders: UserOrderListItemApi[]): UserOrderListItemApi[] {
  return [...orders].sort((a, b) => {
    const ua = a.updatedAt ? Date.parse(a.updatedAt) : NaN;
    const ub = b.updatedAt ? Date.parse(b.updatedAt) : NaN;
    const na = Number.isFinite(ua) ? ua : Date.parse(a.createdAt);
    const nb = Number.isFinite(ub) ? ub : Date.parse(b.createdAt);
    const fa = Number.isFinite(na) ? na : 0;
    const fb = Number.isFinite(nb) ? nb : 0;
    return fb - fa;
  });
}

export function mapUserOrderToWorkCard(
  order: UserOrderListItemApi,
  opts?: { onOpenDetails?: () => void },
): AccountOrderWorkCardProps {
  const thumbs = order.items.map(orderItemThumb).filter(Boolean);
  const skuCount = order.items.length;
  const shortNo = formatOrderDisplayId(order.id);

  const sumLabel =
    order.status === 'PENDING_APPROVAL' ? 'Ожидаемая сумма заказа' : 'Сумма';

  const etaRaw = order.commercialProposalDeliveryEta?.trim();
  const etaDisplay = etaRaw && etaRaw.length ? etaRaw : 'по согласованию';

  const kp = order.commercialProposalOffer;
  const offer =
    kp && (kp.newTotalRub > 0 || kp.oldTotalRub > 0)
      ? (() => {
          const pct = Math.round(kp.avgDiscountPercent * 10) / 10;
          const newR = Math.round(kp.newTotalRub * 100) / 100;
          const oldR = Math.round(kp.oldTotalRub * 100) / 100;
          const hasDiscount = pct > 0 || newR !== oldR;
          return {
            discountLabel: pct > 0 ? `−${pct}%` : '—',
            finalPrice: formatTotalRub(kp.newTotalRub, order.currency),
            oldPrice: formatTotalRub(kp.oldTotalRub, order.currency),
            expectedBonus: 'уточняется',
            showDiscountStrip: hasDiscount,
          };
        })()
      : undefined;

  const metaRows = offer
    ? [
        { label: 'Номер', value: shortNo, valueTitle: order.id },
        { label: 'Позиций', value: String(skuCount) },
        { label: 'Срок доставки', value: etaDisplay },
      ]
    : [
        { label: 'Номер', value: shortNo, valueTitle: order.id },
        { label: 'Позиций', value: String(skuCount) },
        { label: sumLabel, value: formatTotalRub(order.totalAmount, order.currency) },
      ];

  return {
    orderId: order.id,
    statusLabel: orderStatusLabel(order.status, 'ru'),
    dateLine: formatOrderDate(order.createdAt),
    chatTitle: `Чат · ${shortNo}`,
    metaRows,
    productThumbSrcs: thumbs.length ? thumbs : [PLACEHOLDER],
    hideMoreMenu: order.status === 'PENDING_APPROVAL',
    statusRejected: false,
    onOpenDetails: opts?.onOpenDetails,
    detailHref: opts?.onOpenDetails ? undefined : `/account/orders/${order.id}`,
    ctaCount: 1,
    offer,
    staffUnreadCount: order.unreadStaffChatCount ?? 0,
  };
}
