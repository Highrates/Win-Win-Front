import { describe, expect, it } from 'vitest';
import { accountWorkHasNotification, parseAccountWorkUnreadSummary } from './workNotifications';

describe('parseAccountWorkUnreadSummary', () => {
  it('читает count и hasUnseenCommercialProposal', () => {
    expect(
      parseAccountWorkUnreadSummary({ count: 2, hasUnseenCommercialProposal: true, unseenKpCount: 1 }),
    ).toEqual({ count: 2, hasUnseenCommercialProposal: true, unseenKpCount: 1 });
  });

  it('fallback: unseenKpCount → hasUnseen', () => {
    expect(parseAccountWorkUnreadSummary({ count: 0, unseenKpCount: 3 })).toEqual({
      count: 0,
      hasUnseenCommercialProposal: true,
      unseenKpCount: 3,
    });
  });
});

describe('accountWorkHasNotification', () => {
  it('OR chat ∪ KP', () => {
    expect(accountWorkHasNotification({ count: 1, hasUnseenCommercialProposal: false })).toBe(true);
    expect(accountWorkHasNotification({ count: 0, hasUnseenCommercialProposal: true })).toBe(true);
    expect(accountWorkHasNotification({ count: 0, hasUnseenCommercialProposal: false })).toBe(false);
  });
});
