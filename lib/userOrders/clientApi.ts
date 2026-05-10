import type { UserOrderDetailApi, UserOrdersListResponse } from './types';

export async function fetchUserOrdersList(page = 1, limit = 50): Promise<UserOrdersListResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
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
