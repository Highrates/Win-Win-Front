import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const closeChat = vi.fn();
const setAcceptOpen = vi.fn();
let mockChatOpen = false;
let mockAcceptOpen = false;

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

vi.mock('@/hooks/useOrderKpResponse', () => ({
  useOrderKpResponse: () => ({
    chatOpen: mockChatOpen,
    setChatOpen: vi.fn(),
    acceptOpen: mockAcceptOpen,
    setAcceptOpen,
    openAccept: vi.fn(),
    canRespondKp: false,
    chatSeedDraft: undefined,
    composerBanner: undefined,
    chatInputPlaceholder: undefined,
    openChat: vi.fn(),
    openKpChat: vi.fn(),
    closeChat,
    handleChatSend: vi.fn(),
    markAccepted: vi.fn(),
    showKpActions: false,
  }),
}));

vi.mock('@/components/ChatWindow/ChatWindow', () => ({
  ChatWindow: () => null,
}));

vi.mock('./OrderKpAcceptModal', () => ({
  OrderKpAcceptModal: () => null,
}));

vi.mock('./OrderKpActionFooter', () => ({
  OrderKpActionFooter: () => <div data-testid="kp-footer" />,
}));

vi.mock('@/lib/userOrders/clientApi', () => ({
  fetchUserOrder: vi.fn(async () => ({
    id: 'ord-escape-1',
    status: 'PENDING_APPROVAL',
    totalAmount: 1000,
    currency: 'RUB',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    customerName: 'Test',
    deliveryAddress: 'Addr',
    comment: null,
    items: [],
    unreadStaffChatCount: 0,
    latestCommercialProposal: null,
    canRespondToCommercialProposal: false,
  })),
  ackUserOrderCommercialProposalSeen: vi.fn(async () => undefined),
}));

vi.mock('@/lib/useModalFocusTrap', () => ({
  useModalFocusTrap: () => undefined,
}));

describe('AccountOrderDetailModal Escape layering', () => {
  beforeEach(() => {
    closeChat.mockClear();
    setAcceptOpen.mockClear();
    mockChatOpen = false;
    mockAcceptOpen = false;
  });

  it('Escape закрывает модалку, когда чат и accept закрыты', async () => {
    const { AccountOrderDetailModal } = await import('./AccountOrderDetailModal');
    const onClose = vi.fn();
    render(<AccountOrderDetailModal orderId="ord-escape-1" onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    fireEvent.keyDown(document, { key: 'Escape', bubbles: true });
    expect(onClose).toHaveBeenCalled();
    expect(closeChat).not.toHaveBeenCalled();
  });

  it('Escape сначала закрывает чат, не модалку', async () => {
    mockChatOpen = true;
    const { AccountOrderDetailModal } = await import('./AccountOrderDetailModal');
    const onClose = vi.fn();
    render(<AccountOrderDetailModal orderId="ord-escape-1" onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    fireEvent.keyDown(document, { key: 'Escape', bubbles: true });
    expect(closeChat).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Escape закрывает accept-модалку раньше, чем деталку', async () => {
    mockAcceptOpen = true;
    const { AccountOrderDetailModal } = await import('./AccountOrderDetailModal');
    const onClose = vi.fn();
    render(<AccountOrderDetailModal orderId="ord-escape-1" onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    fireEvent.keyDown(document, { key: 'Escape', bubbles: true });
    expect(setAcceptOpen).toHaveBeenCalledWith(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('при chat+accept Escape сначала закрывает accept, не chat', async () => {
    mockAcceptOpen = true;
    mockChatOpen = true;
    const { AccountOrderDetailModal } = await import('./AccountOrderDetailModal');
    const onClose = vi.fn();
    render(<AccountOrderDetailModal orderId="ord-escape-1" onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    fireEvent.keyDown(document, { key: 'Escape', bubbles: true });
    expect(setAcceptOpen).toHaveBeenCalledWith(false);
    expect(closeChat).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
