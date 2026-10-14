import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const closeChat = vi.fn();
const setAcceptOpen = vi.fn();
const openAccept = vi.fn();
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
    openAccept,
    canRespondKp: true,
    displayKpUnseen: false,
    setDisplayKpUnseen: vi.fn(),
    chatSeedDraft: null,
    composerBanner: null,
    chatInputPlaceholder: 'Сообщение',
    openChat: vi.fn(),
    openKpChat: vi.fn(),
    closeChat,
    handleChatSend: vi.fn(),
    markAccepted: vi.fn(),
    showKpActions: true,
  }),
}));

vi.mock('@/components/ChatWindow/ChatWindow', () => ({
  ChatWindow: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="chat">
        <button type="button" onClick={onClose}>
          close-chat
        </button>
      </div>
    ) : null,
}));

vi.mock('./OrderKpAcceptModal', () => ({
  OrderKpAcceptModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="accept">
        <button type="button" onClick={onClose}>
          close-accept
        </button>
      </div>
    ) : null,
}));

describe('AccountOrderWorkCard Escape layering', () => {
  beforeEach(() => {
    closeChat.mockClear();
    setAcceptOpen.mockClear();
    openAccept.mockClear();
    mockChatOpen = false;
    mockAcceptOpen = false;
  });

  it('Escape при открытом accept закрывает только accept, не chat', async () => {
    mockAcceptOpen = true;
    mockChatOpen = true;
    const { AccountOrderWorkCard } = await import('./AccountOrderWorkCard');
    render(
      <AccountOrderWorkCard
        orderId="ord-1"
        statusLabel="КП"
        dateLine="сегодня"
        metaRows={[]}
        productThumbSrcs={[]}
        canRespondToCommercialProposal
        commercialProposalVersion={1}
      />,
    );
    expect(screen.getByTestId('accept')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape', bubbles: true });
    expect(setAcceptOpen).toHaveBeenCalledWith(false);
    expect(closeChat).not.toHaveBeenCalled();
  });

  it('Escape при открытом чате закрывает chat', async () => {
    mockChatOpen = true;
    const { AccountOrderWorkCard } = await import('./AccountOrderWorkCard');
    render(
      <AccountOrderWorkCard
        orderId="ord-1"
        statusLabel="КП"
        dateLine="сегодня"
        metaRows={[]}
        productThumbSrcs={[]}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape', bubbles: true });
    expect(closeChat).toHaveBeenCalled();
  });

  it('Подтвердить вызывает openAccept (закрывает chat перед accept)', async () => {
    const { AccountOrderWorkCard } = await import('./AccountOrderWorkCard');
    render(
      <AccountOrderWorkCard
        orderId="ord-1"
        statusLabel="КП"
        dateLine="сегодня"
        metaRows={[]}
        productThumbSrcs={[]}
        canRespondToCommercialProposal
        commercialProposalVersion={1}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));
    expect(openAccept).toHaveBeenCalled();
  });
});
