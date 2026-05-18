import type { OrderChatVariant } from '@/lib/orderChat/constants';
import { isOrderChatMessageWithinDeleteWindow } from '@/lib/orderChat/constants';

export function computeOrderChatMessageDeletableInUi(opts: {
  variant: OrderChatVariant;
  viewerUserId: string | null;
  deleted: boolean;
  authorUserId: string;
  authorRole: 'CUSTOMER' | 'STAFF';
  createdAtIso: string;
}): boolean {
  const { variant, viewerUserId, deleted, authorUserId, authorRole, createdAtIso } = opts;
  if (deleted) return false;
  const isStaffAuthor = authorRole === 'STAFF';
  const isMineCustomer =
    variant === 'account' && !isStaffAuthor && viewerUserId != null && viewerUserId === authorUserId;
  const mayDeleteByRole =
    variant === 'admin' || (variant === 'account' && isMineCustomer);
  return mayDeleteByRole && isOrderChatMessageWithinDeleteWindow(createdAtIso);
}
