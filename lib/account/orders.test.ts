import { describe, expect, it } from 'vitest';
import {
  accountOrdersDetailHref,
  accountOrdersTabForStatus,
  buildAccountOrdersHref,
} from './orders';

describe('accountOrdersTabForStatus', () => {
  it('orders: draft → preparation, completed → completed, the rest → work', () => {
    expect(accountOrdersTabForStatus('order', 'DRAFT')).toBe('preparation');
    expect(accountOrdersTabForStatus('order', 'COMPLETED')).toBe('completed');
    expect(accountOrdersTabForStatus('order', 'RECEIVED')).toBe('work');
    expect(accountOrdersTabForStatus('order', 'PENDING_APPROVAL')).toBe('work');
    expect(accountOrdersTabForStatus('order', null)).toBe('work');
  });

  it('sourcing: completed / cancelled → completed, the rest → work', () => {
    expect(accountOrdersTabForStatus('sourcing', 'COMPLETED')).toBe('completed');
    expect(accountOrdersTabForStatus('sourcing', 'CANCELLED')).toBe('completed');
    expect(accountOrdersTabForStatus('sourcing', 'IN_PROGRESS')).toBe('work');
    expect(accountOrdersTabForStatus('sourcing', undefined)).toBe('work');
  });
});

describe('accountOrdersDetailHref', () => {
  it('puts the tab of the source status under the modal', () => {
    expect(accountOrdersDetailHref({ kind: 'order', id: 'o1', chat: true, status: 'COMPLETED' })).toBe(
      '/account/orders?tab=completed&order=o1&status=COMPLETED&chat=1',
    );
    expect(accountOrdersDetailHref({ kind: 'sourcing', id: 's1', chat: false, status: 'PENDING_REVIEW' })).toBe(
      '/account/orders?tab=work&sourcing=s1&status=PENDING_REVIEW',
    );
    expect(accountOrdersDetailHref({ kind: 'order', id: 'd1', chat: false, status: 'DRAFT' })).toBe(
      '/account/orders?order=d1&status=DRAFT',
    );
  });
});

describe('buildAccountOrdersHref', () => {
  it('syncs tab + order + chat', () => {
    expect(
      buildAccountOrdersHref({
        tabIndex: 1,
        detail: { kind: 'order', id: 'o1', chat: true },
      }),
    ).toBe('/account/orders?tab=work&order=o1&chat=1');
  });

  it('прокидывает status в query для round-trip вкладки', () => {
    expect(
      buildAccountOrdersHref({
        tabIndex: 2,
        detail: { kind: 'order', id: 'o1', chat: false, status: 'COMPLETED' },
      }),
    ).toBe('/account/orders?tab=completed&order=o1&status=COMPLETED');
  });

  it('clears detail and keeps work tab', () => {
    expect(buildAccountOrdersHref({ tabIndex: 1, detail: null })).toBe('/account/orders?tab=work');
  });
});

describe('accountOrdersDetailFromQuery', () => {
  it('читает status из query', async () => {
    const { accountOrdersDetailFromQuery } = await import('./orders');
    expect(accountOrdersDetailFromQuery({ order: 'o1', status: 'COMPLETED' })).toEqual({
      kind: 'order',
      id: 'o1',
      chat: false,
      status: 'COMPLETED',
    });
  });
});

