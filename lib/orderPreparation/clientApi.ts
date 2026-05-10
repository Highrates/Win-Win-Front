import type { AddOrderPreparationLineBody, OrderPreparationDraftApi } from './types';

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || `HTTP ${res.status}`);
  }
}

export async function fetchOrderPreparationDraft(): Promise<OrderPreparationDraftApi> {
  const res = await fetch('/api/user/orders/preparation', { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<OrderPreparationDraftApi>(res);
}

export async function patchOrderPreparationDraft(body: {
  customerName?: string | null;
  deliveryAddress?: string | null;
  comment?: string | null;
}): Promise<OrderPreparationDraftApi> {
  const res = await fetch('/api/user/orders/preparation', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<OrderPreparationDraftApi>(res);
}

export async function addOrderPreparationLine(body: AddOrderPreparationLineBody): Promise<OrderPreparationDraftApi> {
  const res = await fetch('/api/user/orders/preparation/lines', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<OrderPreparationDraftApi>(res);
}

export async function patchOrderPreparationLineQuantity(
  lineId: string,
  quantity: number,
): Promise<OrderPreparationDraftApi> {
  const res = await fetch(`/api/user/orders/preparation/lines/${encodeURIComponent(lineId)}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<OrderPreparationDraftApi>(res);
}

export async function deleteOrderPreparationLine(lineId: string): Promise<OrderPreparationDraftApi> {
  const res = await fetch(`/api/user/orders/preparation/lines/${encodeURIComponent(lineId)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<OrderPreparationDraftApi>(res);
}

export async function submitOrderPreparationDraft(opts?: { lineIds?: string[] }): Promise<OrderPreparationDraftApi> {
  const payload =
    opts?.lineIds != null && opts.lineIds.length > 0 ? { lineIds: opts.lineIds } : {};
  const res = await fetch('/api/user/orders/preparation/submit', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return parseJson<OrderPreparationDraftApi>(res);
}
