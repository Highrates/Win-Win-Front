/** Ответ `GET /api/user/order-chat/me/unread-count` (chat + агрегат KP-unseen). */
export type AccountWorkUnreadSummary = {
  count: number;
  hasUnseenCommercialProposal: boolean;
  unseenKpCount?: number;
};

export function parseAccountWorkUnreadSummary(raw: unknown): AccountWorkUnreadSummary {
  const j = (raw && typeof raw === 'object' ? raw : {}) as {
    count?: unknown;
    hasUnseenCommercialProposal?: unknown;
    unseenKpCount?: unknown;
  };
  const count = typeof j.count === 'number' && Number.isFinite(j.count) ? j.count : 0;
  const unseenKpCount =
    typeof j.unseenKpCount === 'number' && Number.isFinite(j.unseenKpCount) ? j.unseenKpCount : 0;
  const hasUnseenCommercialProposal =
    typeof j.hasUnseenCommercialProposal === 'boolean'
      ? j.hasUnseenCommercialProposal
      : unseenKpCount > 0;
  return { count, hasUnseenCommercialProposal, unseenKpCount };
}

/** Красная точка вкладки / сайдбара: непрочитанный чат ∪ непросмотренное КП. */
export function accountWorkHasNotification(summary: AccountWorkUnreadSummary): boolean {
  return summary.count > 0 || summary.hasUnseenCommercialProposal;
}
