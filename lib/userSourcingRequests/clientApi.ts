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
      expectedBudget:
        p.showExpectedBudget && p.expectedBudget.trim() ? p.expectedBudget.trim() : undefined,
      referenceImageKeys: p.referenceImages.map((img) => img.id),
    })),
    attachmentKeys: snapshot.formAttachments.map((a) => a.id),
    clientRequestId: snapshot.clientRequestId || undefined,
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

export type SourcingUploadProgress = {
  loaded: number;
  total: number;
  /** `saving` — файлы доставлены, сервер сохраняет заявку (отмена уже не поможет). */
  phase: 'uploading' | 'saving';
};

const SUBMIT_ABORTED = 'SourcingSubmitAborted';

export function isSourcingSubmitAborted(e: unknown): boolean {
  return e instanceof Error && e.name === SUBMIT_ABORTED;
}

function messageFromXhr(xhr: XMLHttpRequest): string {
  if (xhr.status === 413) return 'Файлы заявки слишком большие: суммарно не больше 100 МБ';
  if (xhr.status === 502 || xhr.status === 504) {
    return 'Сервер не ответил вовремя. Отправьте ещё раз — повторная отправка не создаст дубль заявки.';
  }
  try {
    const j = JSON.parse(xhr.responseText) as { message?: unknown };
    if (typeof j?.message === 'string' && j.message.trim()) return j.message;
    if (Array.isArray(j?.message)) return j.message.join(', ');
  } catch {
    /* не JSON — например HTML-страница прокси */
  }
  return `Не удалось отправить заявку (ошибка ${xhr.status || 'сети'})`;
}

/** XHR вместо fetch: у fetch нет прогресса загрузки тела. */
export function submitSourcingRequest(
  snapshot: SourcingFormSnapshot,
  opts?: { signal?: AbortSignal; onProgress?: (p: SourcingUploadProgress) => void },
): Promise<UserSourcingRequestDetailApi> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/user/sourcing-requests');
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');

    const aborted = () => {
      const err = new Error('Отправка отменена');
      err.name = SUBMIT_ABORTED;
      reject(err);
    };
    const onAbortSignal = () => xhr.abort();
    opts?.signal?.addEventListener('abort', onAbortSignal, { once: true });
    const cleanup = () => opts?.signal?.removeEventListener('abort', onAbortSignal);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      opts?.onProgress?.({
        loaded: e.loaded,
        total: e.total,
        phase: e.loaded >= e.total ? 'saving' : 'uploading',
      });
    };
    xhr.upload.onload = () => {
      opts?.onProgress?.({ loaded: 1, total: 1, phase: 'saving' });
    };
    xhr.onload = () => {
      cleanup();
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(messageFromXhr(xhr)));
        return;
      }
      try {
        resolve(parseUserSourcingRequestDetail(JSON.parse(xhr.responseText)));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Некорректный ответ сервера'));
      }
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error('Нет соединения с сервером. Проверьте интернет и отправьте ещё раз.'));
    };
    xhr.onabort = () => {
      cleanup();
      aborted();
    };

    if (opts?.signal?.aborted) {
      cleanup();
      aborted();
      return;
    }
    xhr.send(buildSourcingRequestFormData(snapshot));
  });
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
