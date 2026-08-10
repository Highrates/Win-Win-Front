import type { ReactNode } from 'react';
import type { ChatWindowMessage } from '@/components/ChatWindow/ChatWindow';
import type { ProductQaMessage } from '@/lib/productQa/types';

const PROFILE_AVATAR_PLACEHOLDER = '/images/placeholder.svg';
const STAFF_AVATAR_ACCOUNT = '/images/Admin-avatar.jpeg';

export type ProductQaChatWindowVariant = 'account' | 'admin';

export function mapProductQaToChatWindow(
  m: ProductQaMessage,
  viewerUserId: string | null,
  timeLocale: string,
  variant: ProductQaChatWindowVariant = 'account',
  viewerStaffAvatar?: string | null,
): ChatWindowMessage {
  const isStaff = m.authorRole === 'STAFF';
  const isMine = viewerUserId != null && m.authorUserId === viewerUserId;

  let senderName = m.authorLabel;
  if (variant === 'account') {
    if (isMine) senderName = 'Вы';
    else if (isStaff) senderName = 'Менеджер Win-Win';
  } else {
    if (isMine && isStaff) senderName = 'Вы';
    else if (isStaff) senderName = m.authorLabel || 'Сотрудник';
    else senderName = m.authorLabel || 'Клиент';
  }

  const timeLabel = new Date(m.createdAt).toLocaleTimeString(timeLocale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const docs = m.attachments
    .filter((a) => a.kind === 'FILE')
    .map((a) => ({ id: a.id, filename: a.filename, url: a.url }));
  const imgs = m.attachments
    .filter((a) => a.kind === 'IMAGE')
    .map((a) => ({ id: a.id, src: a.url, alt: '' }));

  let content = m.body.trim() || undefined;
  if (m.replyToPreview?.trim()) {
    const quote = `↳ ${m.replyToPreview.trim()}`;
    content = content ? `${quote}\n\n${content}` : quote;
  }
  if (variant === 'admin' && m.status === 'HIDDEN') {
    const note = 'Скрыто с витрины (не приватная переписка)';
    content = content ? `${content}\n\n(${note})` : `(${note})`;
  }

  if (m.status === 'PENDING') {
    if (variant === 'account' && isMine) {
      const modNote = 'Сообщение на модерации';
      content = content ? `${content}\n\n${modNote}` : modNote;
    } else if (variant === 'admin') {
      const modNote = 'Ожидает модерации';
      content = content ? `${content}\n\n(${modNote})` : `(${modNote})`;
    }
  }

  const avatarRaw = m.authorAvatarUrl?.trim();
  let senderAvatarUrl =
    avatarRaw && avatarRaw.length > 0 ? avatarRaw : PROFILE_AVATAR_PLACEHOLDER;
  if (variant === 'account' && isStaff) {
    senderAvatarUrl =
      avatarRaw && avatarRaw.length > 0 ? avatarRaw : STAFF_AVATAR_ACCOUNT;
  }
  if (variant === 'admin' && isStaff) {
    if (isMine) {
      const mineAvatar = viewerStaffAvatar?.trim() || avatarRaw;
      senderAvatarUrl =
        mineAvatar && mineAvatar.length > 0 ? mineAvatar : PROFILE_AVATAR_PLACEHOLDER;
    } else if (avatarRaw && avatarRaw.length > 0) {
      senderAvatarUrl = avatarRaw;
    }
  }

  return {
    id: m.id,
    senderName,
    senderAvatarUrl,
    timeLabel,
    content,
    documents: docs.length ? docs : undefined,
    images: imgs.length ? imgs : undefined,
    ocCreatedAtIso: m.createdAt,
    editedAtIso: m.editedAt,
  };
}
