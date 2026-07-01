/** Контракт API заявок на подбор (ЛК + админка). Согласован с Nest `sourcing-requests` module. */

import type { SourcingCommercialProposalApi } from '@/lib/sourcingCommercialProposal/types';

export type SourcingCommercialProposalOfferApi = {
  oldTotalRub: number;
  newTotalRub: number;
  avgDiscountPercent: number;
};

export type SourcingRequestStatus =
  | 'PENDING_REVIEW'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type SourcingRequestFileApi = {
  id: string;
  url: string;
  filename: string;
  mimeType: string | null;
};

export type SourcingRequestUserApi = {
  id: string;
  email: string | null;
  phone: string | null;
  profile: null | { firstName: string | null; lastName: string | null };
};

export type SourcingRequestItemApi = {
  id: string;
  name: string;
  productLink: string | null;
  material: string | null;
  color: string | null;
  size: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  expectedBudget: string | null;
  referenceImages: SourcingRequestFileApi[];
};

export type SourcingRequestCoreApi = {
  id: string;
  title: string;
  deliveryCity: string | null;
  status: SourcingRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type UserSourcingRequestItemApi = SourcingRequestItemApi;

export type UserSourcingRequestListItemSummaryApi = {
  id: string;
  name: string;
  referenceImageUrl: string | null;
  referenceImageUrls?: string[];
};

export type UserSourcingRequestListItemApi = SourcingRequestCoreApi & {
  /** Сообщения от сотрудника, не просмотренные клиентом (по чату заявки). */
  unreadStaffChatCount?: number;
  commercialProposalOffer?: SourcingCommercialProposalOfferApi | null;
  commercialProposalDeliveryEta?: string | null;
  commercialProposalImageUrls?: string[];
  /** Дата публикации последнего КП (для сортировки ленты). */
  commercialProposalPublishedAt?: string | null;
  hasUnseenCommercialProposal?: boolean;
  hasPublishedCommercialProposal?: boolean;
  publishedCommercialProposalVersion?: number | null;
  items: UserSourcingRequestListItemSummaryApi[];
};

export type UserSourcingRequestsListResponse = {
  items: UserSourcingRequestListItemApi[];
  total: number;
  page: number;
  limit: number;
};

export type UserSourcingRequestDetailApi = SourcingRequestCoreApi & {
  items: SourcingRequestItemApi[];
  attachments: SourcingRequestFileApi[];
  unreadStaffChatCount?: number;
  latestCommercialProposal?: SourcingCommercialProposalApi | null;
  /** Все опубликованные КП, новые первыми. */
  publishedCommercialProposals?: SourcingCommercialProposalApi[];
};

export type AdminSourcingBucket = 'new' | 'active' | 'completed';

export type AdminSourcingRequestListItemSummaryApi = {
  id: string;
  name: string;
};

export type AdminSourcingRequestListItemApi = SourcingRequestCoreApi & {
  hasChatMessages?: boolean;
  unreadCustomerChatCount?: number;
  user: SourcingRequestUserApi;
  items: AdminSourcingRequestListItemSummaryApi[];
};

export type AdminSourcingRequestsListResponse = {
  items: AdminSourcingRequestListItemApi[];
  total: number;
  page: number;
  limit: number;
};

export type AdminSourcingRequestDetailApi = SourcingRequestCoreApi & {
  user: SourcingRequestUserApi;
  items: SourcingRequestItemApi[];
  attachments: SourcingRequestFileApi[];
};

export type AdminSourcingStatusPatchResponse = Pick<
  AdminSourcingRequestDetailApi,
  'id' | 'status' | 'updatedAt'
>;
