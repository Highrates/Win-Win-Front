export type LikesMeBatchKind = 'product' | 'case' | 'designer';

export const LIKES_BULK_MAX_IDS = 80;
const DEFAULT_ATTEMPTS = 2;
const BACKOFF_MS = [0, 500] as const;

const bulkPath: Record<LikesMeBatchKind, string> = {
  product: '/api/user/likes/products/me/bulk',
  case: '/api/user/likes/cases/me/bulk',
  designer: '/api/user/likes/designers/me/bulk',
};

const bodyKey: Record<LikesMeBatchKind, string> = {
  product: 'productIds',
  case: 'caseIds',
  designer: 'designerIds',
};

export class LikesBulkHttpError extends Error {
  constructor(
    public readonly status: number,
    message?: string,
  ) {
    super(message ?? `likes bulk HTTP ${status}`);
    this.name = 'LikesBulkHttpError';
  }
}

export function isRetryableLikesBulkStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export type LikesBulkHttpDeps = {
  fetchImpl?: typeof fetch;
  sleepMs?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postLikesBulkChunk(
  kind: LikesMeBatchKind,
  ids: string[],
  fetchImpl: typeof fetch,
): Promise<Record<string, boolean>> {
  const res = await fetchImpl(bulkPath[kind], {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ [bodyKey[kind]]: ids }),
    cache: 'no-store',
  });
  if (!res.ok) throw new LikesBulkHttpError(res.status);
  const j = (await res.json()) as { byId?: Record<string, { liked?: boolean }> };
  const byId = j.byId ?? {};
  const out: Record<string, boolean> = {};
  for (const id of ids) out[id] = byId[id]?.liked === true;
  return out;
}

export type FetchLikesBulkOptions = LikesBulkHttpDeps & {
  maxAttempts?: number;
};

/** POST bulk с retry на 429/5xx. При финальной ошибке — throw (ничего не кэшировать). */
export async function fetchLikesBulkByIds(
  kind: LikesMeBatchKind,
  ids: string[],
  opts?: FetchLikesBulkOptions,
): Promise<Record<string, boolean>> {
  const unique = Array.from(new Set(ids.map((x) => x.trim()).filter(Boolean)));
  if (!unique.length) return {};

  const fetchImpl = opts?.fetchImpl ?? fetch;
  const sleepMs = opts?.sleepMs ?? defaultSleep;
  const maxAttempts = opts?.maxAttempts ?? DEFAULT_ATTEMPTS;
  const merged: Record<string, boolean> = {};

  for (let i = 0; i < unique.length; i += LIKES_BULK_MAX_IDS) {
    const chunk = unique.slice(i, i + LIKES_BULK_MAX_IDS);
    let lastStatus = 503;
    let chunkResult: Record<string, boolean> | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const delay = BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
      if (delay > 0) await sleepMs(delay);
      try {
        chunkResult = await postLikesBulkChunk(kind, chunk, fetchImpl);
        break;
      } catch (e) {
        const status = e instanceof LikesBulkHttpError ? e.status : 0;
        lastStatus = status || 503;
        if (!(e instanceof LikesBulkHttpError) || !isRetryableLikesBulkStatus(status)) {
          throw e;
        }
      }
    }

    if (!chunkResult) throw new LikesBulkHttpError(lastStatus);
    Object.assign(merged, chunkResult);
  }

  return merged;
}
