import { readApiErrorMessage } from '@/lib/readApiErrorMessage';

export type ActiveDesignerInviteApi = {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  inviteLink: string;
};

export type ActiveDesignerInvitesResponse = {
  items: ActiveDesignerInviteApi[];
};

export async function fetchActiveDesignerInvites(): Promise<ActiveDesignerInviteApi[]> {
  const res = await fetch('/api/user/designer-invites', { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res));
  }
  const data = (await res.json()) as ActiveDesignerInvitesResponse;
  return Array.isArray(data.items) ? data.items : [];
}

export function formatInviteExpiresLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d);
}
