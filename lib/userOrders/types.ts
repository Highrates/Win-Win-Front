import type { CommercialProposalApi } from '@/lib/commercialProposal/types';

export type UserOrderListItemApi = {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  createdAt: string;
  /** Если нет в ответе API — сортировка использует `createdAt`. */
  updatedAt?: string;
  /** Сообщения от сотрудника, не просмотренные клиентом (по чату заказа). */
  unreadStaffChatCount?: number;
  /** Итоги последнего опубликованного КП (для карточки «В работе» с ценами). */
  commercialProposalOffer?: {
    oldTotalRub: number;
    newTotalRub: number;
    avgDiscountPercent: number;
  } | null;
  /** Сроки из строк опубликованного КП (для карточки «В работе»). */
  commercialProposalDeliveryEta?: string | null;
  /** Дата публикации последнего КП (для сортировки ленты). */
  commercialProposalPublishedAt?: string | null;
  /** Номер версии последнего опубликованного КП (для optimistic concurrency при ответе). */
  commercialProposalVersion?: number | null;
  /** Есть непросмотренная версия опубликованного КП. */
  hasUnseenCommercialProposal?: boolean;
  /** Можно ответить на текущую версию КП (принять / правки / отклонить). */
  canRespondToCommercialProposal?: boolean;
  /** Уже зафиксированный ответ на КП (если на текущую или прошлую версию). */
  customerKpDecision?: 'ACCEPTED' | 'CHANGES_REQUESTED' | 'REJECTED' | null;
  items: {
    quantity: number;
    snapshot?: unknown;
    product: {
      name: string;
      slug: string;
      images?: { url: string }[];
    };
  }[];
};

export type UserOrdersListResponse = {
  items: UserOrderListItemApi[];
  total: number;
  page: number;
  limit: number;
};

export type UserOrderDetailItemApi = {
  id: string;
  quantity: number;
  unit: string;
  price: string | number;
  snapshot?: unknown;
  product: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string }[];
    brand?: { name: string } | null;
  };
};

export type UserOrderDetailApi = {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  comment: string | null;
  customerName: string | null;
  deliveryAddress: string | null;
  /** Телефон из профиля пользователя (если есть). */
  customerPhone?: string | null;
  createdAt: string;
  updatedAt: string;
  items: UserOrderDetailItemApi[];
  /** Непрочитанные сообщения от менеджера в чате по заказу (если отдаёт API). */
  unreadStaffChatCount?: number;
  latestCommercialProposal?: CommercialProposalApi | null;
  /** Версия последнего опубликованного КП. */
  commercialProposalVersion?: number | null;
  /** Можно ответить на текущую версию КП. */
  canRespondToCommercialProposal?: boolean;
  customerKpDecision?: 'ACCEPTED' | 'CHANGES_REQUESTED' | 'REJECTED' | null;
  customerKpDecisionVersion?: number | null;
};
