import { describe, expect, it } from 'vitest';
import { accountOrdersDetailHref, accountOrdersTabForStatus } from './orders';

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
      '/account/orders?tab=completed&order=o1&chat=1',
    );
    expect(accountOrdersDetailHref({ kind: 'sourcing', id: 's1', chat: false, status: 'PENDING_REVIEW' })).toBe(
      '/account/orders?tab=work&sourcing=s1',
    );
    expect(accountOrdersDetailHref({ kind: 'order', id: 'd1', chat: false, status: 'DRAFT' })).toBe(
      '/account/orders?order=d1',
    );
  });
});
