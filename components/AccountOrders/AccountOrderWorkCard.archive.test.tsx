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

describe('AccountOrderWorkCard archive menu', () => {
  it('не показывает «Архивировать» для заявки на подбор', () => {
    render(
      <AccountOrderWorkCard
        orderId="src-1"
        statusLabel="В работе"
        dateLine="Заявка от 1 января"
        metaRows={[{ label: 'Тема', value: 'Стул' }]}
        productThumbSrcs={[]}
        chatSubject="sourcing"
        cornerChipLabel="Подбор"
        hideMoreMenu={false}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Действия по заявке' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Действия по заказу' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Архивировать' })).not.toBeInTheDocument();
  });

  it('показывает меню архива для заказа', () => {
    render(
      <AccountOrderWorkCard
        orderId="ord-1"
        statusLabel="В работе"
        dateLine="Заказ от 1 января"
        metaRows={[{ label: 'Номер', value: 'A1' }]}
        productThumbSrcs={[]}
        chatSubject="order"
      />,
    );
    expect(screen.getByRole('button', { name: 'Действия по заказу' })).toBeInTheDocument();
  });
});
