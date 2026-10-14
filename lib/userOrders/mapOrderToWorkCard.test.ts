import { describe, expect, it } from 'vitest';
import { mapUserOrderToWorkCard } from './mapOrderToWorkCard';
import type { UserOrderListItemApi } from './types';

function baseOrder(over: Partial<UserOrderListItemApi> = {}): UserOrderListItemApi {
  return {
    id: 'ordabcdefghijklmno',
    status: 'PROPOSAL_FORMED',
    totalAmount: 1000,
    currency: 'RUB',
    createdAt: '2026-10-01T12:00:00.000Z',
    items: [],
    ...over,
  };
}

describe('mapUserOrderToWorkCard KP notices', () => {
  it('CHANGES_REQUESTED + canRespond false → notice ожидания нового КП', () => {
    const card = mapUserOrderToWorkCard(
      baseOrder({
        canRespondToCommercialProposal: false,
        customerKpDecision: 'CHANGES_REQUESTED',
      }),
    );
    expect(card.statusNotice).toBe(
      'Запросили изменения — ожидаем новое коммерческое предложение',
    );
    expect(card.statusRejected).toBe(false);
    expect(card.canRespondToCommercialProposal).toBe(false);
  });

  it('REJECTED + canRespond false → notice отклонения и statusRejected', () => {
    const card = mapUserOrderToWorkCard(
      baseOrder({
        canRespondToCommercialProposal: false,
        customerKpDecision: 'REJECTED',
      }),
    );
    expect(card.statusNotice).toBe('Вы отклонили коммерческое предложение');
    expect(card.statusRejected).toBe(true);
  });

  it('canRespond true — notice по decision не показывается', () => {
    const card = mapUserOrderToWorkCard(
      baseOrder({
        canRespondToCommercialProposal: true,
        customerKpDecision: 'REJECTED',
        commercialProposalVersion: 2,
      }),
    );
    expect(card.statusNotice).toBeUndefined();
    expect(card.statusRejected).toBe(false);
    expect(card.canRespondToCommercialProposal).toBe(true);
  });

  it('COMPLETED перекрывает decision notice', () => {
    const card = mapUserOrderToWorkCard(
      baseOrder({
        status: 'COMPLETED',
        canRespondToCommercialProposal: false,
        customerKpDecision: 'REJECTED',
      }),
    );
    expect(card.statusNotice).toBe('Переписка доступна 90 дней после завершения заказа');
  });
});
