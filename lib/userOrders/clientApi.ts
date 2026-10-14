import type { UserOrderDetailApi, UserOrdersListResponse } from './types';

export async function fetchUserOrdersList(
  page = 1,
  limit = 50,
  opts?: { scope?: 'work' | 'completed' },
): Promise<UserOrdersListResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (opts?.scope) qs.set('scope', opts.scope);
  const res = await fetch(`/api/user/orders?${qs}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { message?: unknown };
      if (typeof j?.message === 'string') msg = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<UserOrdersListResponse>;
}

export async function fetchUserOrder(orderId: string): Promise<UserOrderDetailApi> {
  const res = await fetch(`/api/user/orders/${encodeURIComponent(orderId)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { message?: unknown };
      if (typeof j?.message === 'string') msg = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<UserOrderDetailApi>;
}

export type CustomerKpRequisitesPayload = {
  legalType: 'INDIVIDUAL' | 'IE' | 'LLC';
  contactName: string;
  phone?: string;
  companyName?: string;
  inn?: string;
  kpp?: string;
  legalAddress?: string;
  bankName?: string;
  bankAccount?: string;
  bic?: string;
  correspondentAccount?: string;
};

async function readApiError(res: Response): Promise<string> {
  let msg = res.statusText;
  try {
    const j = (await res.json()) as { message?: unknown };
    if (typeof j?.message === 'string') msg = j.message;
    else if (Array.isArray(j?.message)) msg = j.message.map(String).join(', ');
  } catch {
    /* ignore */
  }
  return msg || `HTTP ${res.status}`;
}

/** Скрыть заказ из списков ЛК (soft archive). */
export async function archiveUserOrder(orderId: string): Promise<void> {
  const res = await fetch(`/api/user/orders/${encodeURIComponent(orderId)}/archive`, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

/** Отметить опубликованное КП просмотренным (сброс «новой версии» в счётчиках ЛК). */
export async function ackUserOrderCommercialProposalSeen(orderId: string): Promise<void> {
  const res = await fetch(`/api/user/orders/${encodeURIComponent(orderId)}/commercial-proposal-seen`, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

/** Принять КП и сохранить реквизиты → статус APPROVED. */
export async function acceptUserOrderCommercialProposal(
  orderId: string,
  requisites: CustomerKpRequisitesPayload,
  expectedVersion: number,
): Promise<void> {
  const res = await fetch(
    `/api/user/orders/${encodeURIComponent(orderId)}/commercial-proposal/accept`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requisites, expectedVersion }),
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error(await readApiError(res));
}

/** Зафиксировать «запросить изменения» / «отклонить» после сообщения в чате. */
export async function recordUserOrderCommercialProposalDecision(
  orderId: string,
  decision: 'CHANGES_REQUESTED' | 'REJECTED',
  expectedVersion: number,
): Promise<void> {
  const res = await fetch(
    `/api/user/orders/${encodeURIComponent(orderId)}/commercial-proposal/decision`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, expectedVersion }),
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error(await readApiError(res));
}
