import { fetchLikesBulkByIds, type LikesMeBatchKind } from '@/lib/likesBulkHttp';

export type { LikesMeBatchKind } from '@/lib/likesBulkHttp';

const FLUSH_MS = 40;

type Waiter = {
  resolve: (liked: boolean) => void;
  reject: (reason: unknown) => void;
};

type KindState = {
  cache: Map<string, boolean>;
  pending: Set<string>;
  waiters: Map<string, Waiter[]>;
  flushTimer: ReturnType<typeof setTimeout> | null;
  inFlight: Promise<void> | null;
};

const state: Record<LikesMeBatchKind, KindState> = {
  product: { cache: new Map(), pending: new Set(), waiters: new Map(), flushTimer: null, inFlight: null },
  case: { cache: new Map(), pending: new Set(), waiters: new Map(), flushTimer: null, inFlight: null },
  designer: { cache: new Map(), pending: new Set(), waiters: new Map(), flushTimer: null, inFlight: null },
};

function resolveWaiters(kind: LikesMeBatchKind, id: string, liked: boolean) {
  const list = state[kind].waiters.get(id);
  if (!list?.length) return;
  state[kind].waiters.delete(id);
  for (const w of list) w.resolve(liked);
}

function rejectWaiters(kind: LikesMeBatchKind, ids: string[], reason: unknown) {
  for (const id of ids) {
    const list = state[kind].waiters.get(id);
    if (!list?.length) continue;
    state[kind].waiters.delete(id);
    for (const w of list) w.reject(reason);
  }
}

function settleIds(kind: LikesMeBatchKind, likedById: Record<string, boolean>) {
  for (const [id, liked] of Object.entries(likedById)) {
    state[kind].cache.set(id, liked);
    resolveWaiters(kind, id, liked);
  }
}

async function flushKind(kind: LikesMeBatchKind) {
  const s = state[kind];
  if (s.inFlight) {
    await s.inFlight.catch(() => undefined);
    if (s.pending.size === 0) return;
  }

  const ids = [...s.pending];
  s.pending.clear();
  if (!ids.length) return;

  const run = async () => {
    try {
      const likedById = await fetchLikesBulkByIds(kind, ids);
      for (const id of ids) {
        if (!(id in likedById)) likedById[id] = false;
      }
      settleIds(kind, likedById);
    } catch (err) {
      rejectWaiters(kind, ids, err);
    }
  };

  s.inFlight = run().finally(() => {
    s.inFlight = null;
    if (s.pending.size > 0) void flushKind(kind);
  });
  await s.inFlight;
}

function scheduleFlush(kind: LikesMeBatchKind) {
  const s = state[kind];
  if (s.flushTimer) return;
  s.flushTimer = setTimeout(() => {
    s.flushTimer = null;
    void flushKind(kind);
  }, FLUSH_MS);
}

/** Batched POST для разрозненных карточек (PDP, модалки). При 429/5xx — reject, без кэша «не лайкнуто». */
export function fetchLikedMeBatched(kind: LikesMeBatchKind, id: string): Promise<boolean> {
  const trimmed = id.trim();
  if (!trimmed) return Promise.resolve(false);

  const s = state[kind];
  if (s.cache.has(trimmed)) return Promise.resolve(s.cache.get(trimmed) === true);

  return new Promise((resolve, reject) => {
    const list = s.waiters.get(trimmed);
    const waiter: Waiter = { resolve, reject };
    if (list) list.push(waiter);
    else s.waiters.set(trimmed, [waiter]);
    s.pending.add(trimmed);
    scheduleFlush(kind);
  });
}

export function setLikedMeBatchCache(kind: LikesMeBatchKind, id: string, liked: boolean) {
  const trimmed = id.trim();
  if (!trimmed) return;
  state[kind].cache.set(trimmed, liked);
}

export function clearLikesMeBatchCache() {
  for (const kind of Object.keys(state) as LikesMeBatchKind[]) {
    const s = state[kind];
    s.cache.clear();
    s.pending.clear();
    s.waiters.clear();
    if (s.flushTimer) clearTimeout(s.flushTimer);
    s.flushTimer = null;
    s.inFlight = null;
  }
}
