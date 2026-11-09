import { readApiErrorMessage } from '@/lib/readApiErrorMessage';

export type DesignerInviteStatus =
  | 'pending'
  | 'pending_admin'
  | 'accepted'
  | 'expired'
  | 'revoked'
  | 'rejected';

export type ActiveDesignerInviteApi = {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  inviteLink: string;
  status: DesignerInviteStatus;
  statusLabel: string;
  rejectReason?: string | null;
  canRevoke?: boolean;
  canResend?: boolean;
};

export type DesignerInviteStatusCounts = {
  pending: number;
  pending_admin: number;
  accepted: number;
  expired: number;
  revoked: number;
  rejected: number;
};

export type ActiveDesignerInvitesResponse = {
  items: ActiveDesignerInviteApi[];
  total?: number;
  truncated?: boolean;
  listLimit?: number;
  statusCounts?: DesignerInviteStatusCounts;
};

export type ResendDesignerInviteResult = {
  ok?: boolean;
  emailSent?: boolean;
  inviteLink?: string;
  inviteTtlLabel?: string;
};

export async function fetchActiveDesignerInvites(): Promise<ActiveDesignerInvitesResponse> {
  const res = await fetch('/api/user/designer-invites', { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res));
  }
  const data = (await res.json()) as ActiveDesignerInvitesResponse;
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: typeof data.total === 'number' ? data.total : undefined,
    truncated: Boolean(data.truncated),
    listLimit: typeof data.listLimit === 'number' ? data.listLimit : undefined,
    statusCounts: data.statusCounts,
  };
}

export async function revokeDesignerInvite(id: string): Promise<void> {
  const res = await fetch(`/api/user/designer-invites/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res));
  }
}

export async function resendDesignerInvite(id: string): Promise<ResendDesignerInviteResult> {
  const res = await fetch(`/api/user/designer-invites/${encodeURIComponent(id)}/resend`, {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res));
  }
  const data = (await res.json().catch(() => ({}))) as ResendDesignerInviteResult;
  return data;
}

export function formatResendResultMessage(result: ResendDesignerInviteResult): string {
  if (result.emailSent === false) {
    return 'Письмо не удалось отправить — передайте ссылку сами.';
  }
  return 'Приглашение переотправлено.';
}

export function formatInviteShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d);
}

export function formatInviteExpiresLabel(iso: string): string {
  return formatInviteShortDate(iso);
}

/** Мета строки списка: «отправлено 9 нояб. · до 23 нояб.» для pending. */
export function formatInviteRowMeta(item: ActiveDesignerInviteApi): string {
  const status = item.status ?? 'pending';
  if (status === 'pending') {
    const sent = formatInviteShortDate(item.createdAt);
    const until = formatInviteShortDate(item.expiresAt);
    if (sent && until) return `отправлено ${sent} · до ${until}`;
    if (until) return `до ${until}`;
    return 'ожидает ответа';
  }
  return item.statusLabel || status;
}

export function summarizeInviteStatuses(
  counts: DesignerInviteStatusCounts | ActiveDesignerInviteApi[],
): string {
  const c: DesignerInviteStatusCounts = Array.isArray(counts)
    ? {
        pending: counts.filter((i) => i.status === 'pending').length,
        pending_admin: counts.filter((i) => i.status === 'pending_admin').length,
        accepted: counts.filter((i) => i.status === 'accepted').length,
        expired: counts.filter((i) => i.status === 'expired').length,
        revoked: counts.filter((i) => i.status === 'revoked').length,
        rejected: counts.filter((i) => i.status === 'rejected').length,
      }
    : {
        pending: counts.pending ?? 0,
        pending_admin: counts.pending_admin ?? 0,
        accepted: counts.accepted ?? 0,
        expired: counts.expired ?? 0,
        revoked: counts.revoked ?? 0,
        rejected: counts.rejected ?? 0,
      };
  const parts: string[] = [];
  if (c.pending) parts.push(`Ожидают ответа (${c.pending})`);
  if (c.pending_admin) parts.push(`На проверке (${c.pending_admin})`);
  if (c.accepted) parts.push(`Принято (${c.accepted})`);
  if (c.expired) parts.push(`Истекло (${c.expired})`);
  if (c.revoked) parts.push(`Отозвано (${c.revoked})`);
  if (c.rejected) parts.push(`Отклонено (${c.rejected})`);
  return parts.length ? parts.join(' · ') : 'пока пусто';
}
