import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountOrderWorkCard } from './AccountOrderWorkCard';

vi.mock('@/hooks/useOrderChat', () => ({
  useOrderChat: () => ({
    chatMessages: [],
    chatLoading: false,
    chatError: null,
    chatComposerDisabled: false,
    chatAttachPickerDisabled: false,
    pendingAttachmentsHint: null,
    pendingOutgoingAttachments: [],
    canSendAttachmentMessage: false,
    sendChatText: vi.fn(async () => true),
    attachChatFiles: vi.fn(),
    removePendingChatAttachment: vi.fn(),
    deleteChatMessage: vi.fn(),
    chatHasOlderHistory: false,
    chatLoadingOlderHistory: false,
    loadOlderChatMessages: vi.fn(),
  }),
}));

vi.mock('@/components/ChatWindow/ChatWindow', () => ({
  ChatWindow: () => null,
}));

vi.mock('./OrderKpAcceptModal', () => ({
  OrderKpAcceptModal: () => null,
}));

describe('AccountOrderWorkCard KP CTA', () => {
  it('показывает текстовые лейблы «Изменения» / «Отклонить» рядом с иконками', () => {
    render(
      <AccountOrderWorkCard
        orderId="ord-1"
        statusLabel="Предложение сформировано"
        dateLine="Заказ от 1 января"
        metaRows={[{ label: 'Номер', value: 'A1' }]}
        productThumbSrcs={[]}
        canRespondToCommercialProposal
        commercialProposalVersion={1}
        chatSubject="order"
      />,
    );

    expect(screen.getByRole('button', { name: 'Запросить изменения' })).toBeInTheDocument();
    expect(screen.getByText('Изменения')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отклонить' })).toBeInTheDocument();
    expect(screen.getByText('Отклонить')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeInTheDocument();
  });
});
