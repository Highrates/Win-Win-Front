/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { ACCOUNT_WORK_FEED_REFRESH_EVENT } from '@/lib/account/orders';
import type { CommercialProposalApi } from '@/lib/commercialProposal/types';
import {
  KP_PROPOSAL_CACHE_MAX,
  __kpProposalCacheSizeForTests,
  cacheOrderCommercialProposal,
  clearAllCommercialProposalCaches,
  clearOrderCommercialProposalCache,
  getCachedOrderCommercialProposal,
} from './kpProposalCache';

function proposal(versionNumber: number, id = 'kp-1'): CommercialProposalApi {
  return {
    id,
    versionNumber,
    status: 'PUBLISHED',
    publishedAt: '2026-01-01T00:00:00.000Z',
    currency: 'RUB',
    lines: [
      {
        id: 'line-1',
        sortOrder: 0,
        productName: 'Стол',
        quantity: 1,
        unitPrice: 1000,
        lineTotal: 1000,
      },
    ],
  } as CommercialProposalApi;
}

describe('kpProposalCache version key', () => {
  beforeEach(() => {
    clearAllCommercialProposalCaches();
  });

  it('returns only matching versionNumber', () => {
    cacheOrderCommercialProposal('ord-1', proposal(1));
    cacheOrderCommercialProposal('ord-1', proposal(2));

    expect(getCachedOrderCommercialProposal('ord-1', 1)?.versionNumber).toBe(1);
    expect(getCachedOrderCommercialProposal('ord-1', 2)?.versionNumber).toBe(2);
    expect(getCachedOrderCommercialProposal('ord-1', 3)).toBeNull();
  });

  it('miss without version (no unversioned fallback)', () => {
    cacheOrderCommercialProposal('ord-1', proposal(2));
    expect(getCachedOrderCommercialProposal('ord-1')).toBeNull();
    expect(getCachedOrderCommercialProposal('ord-1', null)).toBeNull();
    expect(getCachedOrderCommercialProposal('ord-1', 0)).toBeNull();
  });

  it('does not cache proposal without valid version', () => {
    cacheOrderCommercialProposal('ord-1', { ...proposal(1), versionNumber: 0 });
    expect(getCachedOrderCommercialProposal('ord-1', 1)).toBeNull();
  });

  it('clearOrderCommercialProposalCache removes all versions for order', () => {
    cacheOrderCommercialProposal('ord-1', proposal(1));
    cacheOrderCommercialProposal('ord-1', proposal(2));
    cacheOrderCommercialProposal('ord-2', proposal(1));
    clearOrderCommercialProposalCache('ord-1');
    expect(getCachedOrderCommercialProposal('ord-1', 1)).toBeNull();
    expect(getCachedOrderCommercialProposal('ord-1', 2)).toBeNull();
    expect(getCachedOrderCommercialProposal('ord-2', 1)?.versionNumber).toBe(1);
  });

  it('clears on ACCOUNT_WORK_FEED_REFRESH_EVENT (decision / feed refresh)', () => {
    cacheOrderCommercialProposal('ord-1', proposal(2));
    expect(getCachedOrderCommercialProposal('ord-1', 2)).not.toBeNull();
    window.dispatchEvent(new CustomEvent(ACCOUNT_WORK_FEED_REFRESH_EVENT));
    expect(getCachedOrderCommercialProposal('ord-1', 2)).toBeNull();
  });

  it('LRU: вытесняет старые при > KP_PROPOSAL_CACHE_MAX', () => {
    for (let i = 1; i <= KP_PROPOSAL_CACHE_MAX + 3; i++) {
      cacheOrderCommercialProposal(`ord-${i}`, proposal(1, `kp-${i}`));
    }
    expect(__kpProposalCacheSizeForTests('order')).toBe(KP_PROPOSAL_CACHE_MAX);
    expect(getCachedOrderCommercialProposal('ord-1', 1)).toBeNull();
    expect(getCachedOrderCommercialProposal(`ord-${KP_PROPOSAL_CACHE_MAX + 3}`, 1)).not.toBeNull();
  });

  it('LRU: get touch сохраняет запись при eviction', () => {
    for (let i = 1; i <= KP_PROPOSAL_CACHE_MAX; i++) {
      cacheOrderCommercialProposal(`ord-${i}`, proposal(1, `kp-${i}`));
    }
    expect(getCachedOrderCommercialProposal('ord-1', 1)).not.toBeNull();
    cacheOrderCommercialProposal('ord-new', proposal(1, 'kp-new'));
    expect(__kpProposalCacheSizeForTests('order')).toBe(KP_PROPOSAL_CACHE_MAX);
    expect(getCachedOrderCommercialProposal('ord-1', 1)).not.toBeNull();
    expect(getCachedOrderCommercialProposal('ord-2', 1)).toBeNull();
  });
});
