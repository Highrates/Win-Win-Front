import type { ChatWindowMessage } from '@/components/ChatWindow/ChatWindow';
import type { ProductCorrespondenceMessage } from './types';

const PROFILE_AVATAR_PLACEHOLDER = '/images/placeholder.svg';
const STAFF_AVATAR_ACCOUNT = '/images/Admin-avatar.jpeg';

export type CorrespondenceChatWindowVariant = 'account' | 'admin';

export function mapCorrespondenceToChatWindow(
  m: ProductCorrespondenceMessage,
  viewerUserId: string | null,
  timeLocale: string,
  variant: CorrespondenceChatWindowVariant = 'account',
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
  if (variant === 'admin' && m.isPublishedToStorefront) {
    const note = 'Опубликовано на витрине';
    content = content ? `${content}\n\n(${note})` : `(${note})`;
  }

  const avatarRaw = m.authorAvatarUrl?.trim();
  let senderAvatarUrl =
    avatarRaw && avatarRaw.length > 0 ? avatarRaw : PROFILE_AVATAR_PLACEHOLDER;
  if (variant === 'account' && isStaff) {
    senderAvatarUrl =
      avatarRaw && avatarRaw.length > 0 ? avatarRaw : STAFF_AVATAR_ACCOUNT;
  }
  if (variant === 'admin' && isStaff && isMine) {
    const mineAvatar = viewerStaffAvatar?.trim() || avatarRaw;
    senderAvatarUrl =
      mineAvatar && mineAvatar.length > 0 ? mineAvatar : PROFILE_AVATAR_PLACEHOLDER;
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
