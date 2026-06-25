import type { AccountOrderWorkCardProps } from '@/components/AccountOrders/AccountOrderWorkCard';
import { formatOrderDisplayId } from '@/lib/orders/formatOrderDisplayId';
import {
  formatDesignerOwnExpectedBonusLabel,
  type OrderProgramPublic,
} from '@/lib/orderProgram/publicOrderProgram';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import { sourcingStatusLabel } from './sourcingStatus';
import type { UserSourcingRequestListItemApi } from './types';

const COMPLETED_CHAT_NOTICE = 'Переписка доступна 90 дней после завершения заявки';
const CANCELLED_CHAT_NOTICE = 'Чат закрыт — заявка отменена';

const PLACEHOLDER = '/images/placeholder.svg';

function formatSourcingDate(iso: string): string {
  try {
    const d = new Date(iso);
    const datePart = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
    return `Заявка от ${datePart}`;
  } catch {
    return 'Заявка на подбор';
  }
}

function formatTotalRub(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sortSourcingRequestsByUpdatedDesc(
  items: UserSourcingRequestListItemApi[],
): UserSourcingRequestListItemApi[] {
  return [...items].sort((a, b) => {
    const ua = Date.parse(a.updatedAt);
    const ub = Date.parse(b.updatedAt);
    const fa = Number.isFinite(ua) ? ua : Date.parse(a.createdAt);
    const fb = Number.isFinite(ub) ? ub : Date.parse(b.createdAt);
    return fb - fa;
  });
}

export function mapSourcingRequestToWorkCard(
  request: UserSourcingRequestListItemApi,
  opts?: { onOpenDetails?: () => void; orderProgram?: OrderProgramPublic | null },
): AccountOrderWorkCardProps {
  const kpThumbs = (request.commercialProposalImageUrls ?? [])
    .map((url) => url?.trim())
    .filter(Boolean)
    .map((url) => resolveMediaUrlForClient(url));
  const requestThumbs = request.items
    .map((item) => item.referenceImageUrl)
    .filter((url): url is string => Boolean(url?.trim()));
  const shortNo = formatOrderDisplayId(request.id);

  const etaRaw = request.commercialProposalDeliveryEta?.trim();
  const etaDisplay = etaRaw && etaRaw.length ? etaRaw : 'по согласованию';

  const kp = request.commercialProposalOffer;
  const hasPublishedKp = Boolean(
    request.hasPublishedCommercialProposal ||
      kp ||
      request.hasUnseenCommercialProposal ||
      (request.commercialProposalDeliveryEta?.trim()?.length ?? 0) > 0,
  );
  const offer = hasPublishedKp
    ? {
        discountLabel: '—',
        finalPrice:
          kp && (kp.newTotalRub > 0 || kp.oldTotalRub > 0) ? formatTotalRub(kp.newTotalRub) : '—',
        oldPrice: kp && kp.oldTotalRub > 0 ? formatTotalRub(kp.oldTotalRub) : '—',
        expectedBonus:
          kp && kp.newTotalRub > 0
            ? formatDesignerOwnExpectedBonusLabel(kp.newTotalRub, opts?.orderProgram)
            : '—',
        showDiscountStrip: false,
      }
    : undefined;

  const metaRows = offer
    ? [
        { label: 'Номер', value: shortNo, valueTitle: request.id },
        { label: 'Позиций', value: String(request.items.length) },
        { label: 'Срок поставки', value: etaDisplay },
      ]
    : [
        { label: 'Номер', value: shortNo, valueTitle: request.id },
        { label: 'Позиций', value: String(request.items.length) },
        ...(request.deliveryCity?.trim()
          ? [{ label: 'Город доставки', value: request.deliveryCity.trim() }]
          : []),
        { label: 'Тема', value: request.title.trim() || '—' },
      ];

  const isCompleted = request.status === 'COMPLETED';
  const isCancelled = request.status === 'CANCELLED';

  return {
    orderId: request.id,
    statusLabel: sourcingStatusLabel(request.status),
    dateLine: formatSourcingDate(request.createdAt),
    chatTitle: `Чат · ${shortNo}`,
    chatSubject: 'sourcing' as const,
    metaRows,
    productThumbSrcs: hasPublishedKp
      ? kpThumbs.length
        ? kpThumbs
        : [PLACEHOLDER]
      : requestThumbs.length
        ? requestThumbs
        : [PLACEHOLDER],
    hideMoreMenu: false,
    cornerChipLabel: 'Подбор',
    staffUnreadCount: request.unreadStaffChatCount ?? 0,
    hasUnseenCommercialProposal: request.hasUnseenCommercialProposal ?? false,
    detailLinkLabel: 'Подробнее о заявке',
    onOpenDetails: opts?.onOpenDetails,
    offer,
    statusNotice: isCompleted ? COMPLETED_CHAT_NOTICE : isCancelled ? CANCELLED_CHAT_NOTICE : undefined,
    statusRejected: isCancelled,
    chatEnabled: !isCancelled,
  };
}
