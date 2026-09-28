import type { UserRole } from '@/types';

export type ChatViewer = {
  id: string;
  /** ADMIN / MODERATOR: публичный чат товара им закрыт, ответы — из админки. */
  isStaff: boolean;
};

export async function fetchChatViewer(): Promise<ChatViewer | null> {
  try {
    const res = await fetch('/api/user/session', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      authenticated?: boolean;
      user?: { id?: string; role?: UserRole };
    };
    if (!data.authenticated) return null;
    const id = data.user?.id?.trim();
    if (!id) return null;
    const role = data.user?.role;
    return { id, isStaff: role === 'ADMIN' || role === 'MODERATOR' };
  } catch {
    return null;
  }
}
