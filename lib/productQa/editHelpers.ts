import { PRODUCT_QA_EDIT_WITHIN_MS } from '@/lib/productQa/constants';
import type { ProductCorrespondenceMessage } from '@/lib/productCorrespondence/types';

export function canUserEditCorrespondenceMessage(
  message: ProductCorrespondenceMessage,
  viewerUserId: string | null,
  nowMs = Date.now(),
): boolean {
  if (!viewerUserId || message.authorUserId !== viewerUserId) return false;
  if (message.authorRole !== 'USER') return false;
  return nowMs - new Date(message.createdAt).getTime() <= PRODUCT_QA_EDIT_WITHIN_MS;
}

export function formatEditedAtLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'изменено';
  return `Изменено ${d.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
