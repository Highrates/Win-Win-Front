import type { CommercialProposalApi } from '@/lib/commercialProposal/types';
import type { SourcingCommercialProposalApi } from '@/lib/sourcingCommercialProposal/types';

const orderCache = new Map<string, CommercialProposalApi>();
const sourcingCache = new Map<string, SourcingCommercialProposalApi>();

export function cacheOrderCommercialProposal(orderId: string, proposal: CommercialProposalApi | null | undefined): void {
  if (!orderId || !proposal?.lines?.length) return;
  orderCache.set(orderId, proposal);
}

export function getCachedOrderCommercialProposal(orderId: string): CommercialProposalApi | null {
  return orderCache.get(orderId) ?? null;
}

export function cacheSourcingCommercialProposal(
  requestId: string,
  proposal: SourcingCommercialProposalApi | null | undefined,
): void {
  if (!requestId || !proposal?.lines?.length) return;
  sourcingCache.set(requestId, proposal);
}

export function getCachedSourcingCommercialProposal(requestId: string): SourcingCommercialProposalApi | null {
  return sourcingCache.get(requestId) ?? null;
}

export function clearOrderCommercialProposalCache(orderId?: string): void {
  if (orderId) orderCache.delete(orderId);
  else orderCache.clear();
}
