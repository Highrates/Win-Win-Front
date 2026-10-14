import { describe, expect, it } from 'vitest';
import { buildWorkFeed, workFeedTimestamp } from './workFeed';
import type { UserOrderListItemApi } from '@/lib/userOrders/types';
import type { UserSourcingRequestListItemApi } from '@/lib/userSourcingRequests/types';

function order(partial: Partial<UserOrderListItemApi> & { id: string }): UserOrderListItemApi {
  return {
    status: 'RECEIVED',
    totalAmount: 0,
    currency: 'RUB',
    createdAt: '2026-01-01T00:00:00.000Z',
    items: [],
    ...partial,
  };
}

function sourcing(
  partial: Partial<UserSourcingRequestListItemApi> & { id: string },
): UserSourcingRequestListItemApi {
  return {
    title: 't',
    deliveryCity: null,
    status: 'IN_PROGRESS',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    items: [],
    ...partial,
  };
}

describe('buildWorkFeed sort', () => {
  it('поднимает карточку по max(updatedAt, kpPublishedAt, createdAt)', () => {
    const olderKp = order({
      id: 'o-kp',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      commercialProposalPublishedAt: '2026-01-10T00:00:00.000Z',
    });
    const newerUpdate = order({
      id: 'o-upd',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-12T00:00:00.000Z',
      commercialProposalPublishedAt: '2026-01-05T00:00:00.000Z',
    });
    const feed = buildWorkFeed([olderKp, newerUpdate], []);
    expect(feed.map((e) => (e.kind === 'order' ? e.order.id : e.sourcing.id))).toEqual([
      'o-upd',
      'o-kp',
    ]);
  });

  it('учитывает updatedAt заявки на подбор', () => {
    const a = sourcing({
      id: 's1',
      updatedAt: '2026-01-03T00:00:00.000Z',
      commercialProposalPublishedAt: '2026-01-02T00:00:00.000Z',
    });
    const b = sourcing({
      id: 's2',
      updatedAt: '2026-01-01T00:00:00.000Z',
      commercialProposalPublishedAt: '2026-01-04T00:00:00.000Z',
    });
    expect(workFeedTimestamp({ kind: 'sourcing', sourcing: b })).toBeGreaterThan(
      workFeedTimestamp({ kind: 'sourcing', sourcing: a }),
    );
    const feed = buildWorkFeed([], [a, b]);
    expect(feed[0]?.kind === 'sourcing' && feed[0].sourcing.id).toBe('s2');
  });
});
