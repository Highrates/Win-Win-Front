import type { SourcingFormSnapshot } from '@/components/SourcingRequest/sourcingDraft';
import {
  parseUserSourcingRequestDetail,
  parseUserSourcingRequestsList,
} from './apiSchema';
import type {
  UserSourcingRequestDetailApi,
  UserSourcingRequestsListResponse,
} from './types';

function buildSourcingRequestFormData(snapshot: SourcingFormSnapshot): FormData {
  const fd = new FormData();
  const payload = {
    title: snapshot.requestTitle.trim(),
    deliveryCity: snapshot.deliveryCity.trim() || undefined,
    products: snapshot.products.map((p) => ({
      name: p.name.trim(),
      productLink: p.productLink.trim() || undefined,
      material: p.material.trim() || undefined,
      color: p.color.trim() || undefined,
      size: p.size.trim() || undefined,
      description: p.description.trim() || undefined,
      quantity: Math.max(1, parseInt(p.quantity, 10) || 1),
      unit: p.unit,
      expectedBudget: p.expectedBudget.trim() || undefined,
      referenceImageKeys: p.referenceImages.map((img) => img.id),
    })),
    attachmentKeys: snapshot.formAttachments.map((a) => a.id),
  };
  fd.append('payload', JSON.stringify(payload));
  for (const product of snapshot.products) {
    for (const img of product.referenceImages) {
      fd.append(img.id, img.file);
    }
  }
  for (const att of snapshot.formAttachments) {
    fd.append(att.id, att.file);
  }
  return fd;
}

async function readApiError(res: Response): Promise<string> {
  let msg = res.statusText;
  try {
    const j = (await res.json()) as { message?: unknown };
    if (typeof j?.message === 'string') msg = j.message;
    else if (Array.isArray(j?.message)) msg = j.message.join(', ');
  } catch {
    /* ignore */
  }
  return msg || `HTTP ${res.status}`;
}

export async function submitSourcingRequest(
  snapshot: SourcingFormSnapshot,
): Promise<UserSourcingRequestDetailApi> {
  const res = await fetch('/api/user/sourcing-requests', {
    method: 'POST',
    credentials: 'include',
    body: buildSourcingRequestFormData(snapshot),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return parseUserSourcingRequestDetail(await res.json());
}

export async function fetchUserSourcingRequestsList(
  page = 1,
  limit = 50,
  opts?: { scope?: 'work' | 'completed' },
): Promise<UserSourcingRequestsListResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (opts?.scope) qs.set('scope', opts.scope);
  const res = await fetch(`/api/user/sourcing-requests?${qs}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return parseUserSourcingRequestsList(await res.json());
}

export async function fetchUserSourcingRequest(id: string): Promise<UserSourcingRequestDetailApi> {
  const res = await fetch(`/api/user/sourcing-requests/${encodeURIComponent(id)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return parseUserSourcingRequestDetail(await res.json());
}

export async function ackUserSourcingCommercialProposalSeen(id: string): Promise<void> {
  const res = await fetch(
    `/api/user/sourcing-requests/${encodeURIComponent(id)}/commercial-proposal-seen`,
    { method: 'PATCH', credentials: 'include' },
  );
  if (!res.ok) throw new Error(await readApiError(res));
}
