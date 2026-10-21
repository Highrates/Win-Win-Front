import { ACCOUNT_WORK_FEED_REFRESH_EVENT } from '@/lib/account/orders';
import type { CommercialProposalApi } from '@/lib/commercialProposal/types';
import type { SourcingCommercialProposalApi } from '@/lib/sourcingCommercialProposal/types';

/** Макс. versioned entries на Map (order / sourcing отдельно). */
export const KP_PROPOSAL_CACHE_MAX = 32;

const orderCache = new Map<string, CommercialProposalApi>();
const sourcingCache = new Map<string, SourcingCommercialProposalApi>();

function versionedKey(id: string, versionNumber: number): string {
  return `${id}:${versionNumber}`;
}

function isValidVersion(versionNumber: number | null | undefined): versionNumber is number {
  return typeof versionNumber === 'number' && Number.isFinite(versionNumber) && versionNumber >= 1;
}

/** LRU: touch = delete+set (хвост = свежий); eviction с головы. */
function lruSet<T>(map: Map<string, T>, key: string, value: T, max = KP_PROPOSAL_CACHE_MAX): void {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  while (map.size > max) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

function lruGet<T>(map: Map<string, T>, key: string): T | undefined {
  const hit = map.get(key);
  if (hit === undefined) return undefined;
  map.delete(key);
  map.set(key, hit);
  return hit;
}

/** @internal tests */
export function __kpProposalCacheSizeForTests(kind: 'order' | 'sourcing'): number {
  return kind === 'order' ? orderCache.size : sourcingCache.size;
}

/** Кэш только с version — иначе карточка может отдать устаревший PDF после нового publish. */
export function cacheOrderCommercialProposal(
  orderId: string,
  proposal: CommercialProposalApi | null | undefined,
): void {
  if (!orderId || !proposal?.lines?.length || !isValidVersion(proposal.versionNumber)) return;
  lruSet(orderCache, versionedKey(orderId, proposal.versionNumber), proposal);
}

/**
 * Вернуть КП только если version совпадает с props карточки / detail.
 * Без version — miss (не отдаём чужую/старую версию).
 */
export function getCachedOrderCommercialProposal(
  orderId: string,
  versionNumber?: number | null,
): CommercialProposalApi | null {
  if (!orderId || !isValidVersion(versionNumber)) return null;
  const hit = lruGet(orderCache, versionedKey(orderId, versionNumber));
  if (!hit || hit.versionNumber !== versionNumber) return null;
  return hit;
}

export function cacheSourcingCommercialProposal(
  requestId: string,
  proposal: SourcingCommercialProposalApi | null | undefined,
): void {
  if (!requestId || !proposal?.lines?.length || !isValidVersion(proposal.versionNumber)) return;
  lruSet(sourcingCache, versionedKey(requestId, proposal.versionNumber), proposal);
}

export function getCachedSourcingCommercialProposal(
  requestId: string,
  versionNumber?: number | null,
): SourcingCommercialProposalApi | null {
  if (!requestId || !isValidVersion(versionNumber)) return null;
  const hit = lruGet(sourcingCache, versionedKey(requestId, versionNumber));
  if (!hit || hit.versionNumber !== versionNumber) return null;
  return hit;
}

export function clearOrderCommercialProposalCache(orderId?: string): void {
  if (!orderId) {
    orderCache.clear();
    return;
  }
  const prefix = `${orderId}:`;
  for (const key of Array.from(orderCache.keys())) {
    if (key === orderId || key.startsWith(prefix)) orderCache.delete(key);
  }
}

export function clearSourcingCommercialProposalCache(requestId?: string): void {
  if (!requestId) {
    sourcingCache.clear();
    return;
  }
  const prefix = `${requestId}:`;
  for (const key of Array.from(sourcingCache.keys())) {
    if (key === requestId || key.startsWith(prefix)) sourcingCache.delete(key);
  }
}

export function clearAllCommercialProposalCaches(): void {
  orderCache.clear();
  sourcingCache.clear();
}

/** После refresh ленты / decision — сбросить кэш, чтобы не отдать PDF до refetch карточки. */
function bindWorkFeedRefreshInvalidation(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener(ACCOUNT_WORK_FEED_REFRESH_EVENT, () => {
    clearAllCommercialProposalCaches();
  });
}

bindWorkFeedRefreshInvalidation();
