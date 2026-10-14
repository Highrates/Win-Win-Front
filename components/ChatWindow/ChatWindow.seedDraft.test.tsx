import { render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ChatWindow } from './ChatWindow';

vi.mock('react-dom', async (orig) => {
  const actual = await orig<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock('@/lib/orderChat/openOrderChatPhotoSwipe', () => ({
  openOrderChatPhotoSwipe: vi.fn(),
}));

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

describe('ChatWindow seedDraft', () => {
  it('при open заполняет композер seedDraft и не стирает вторым эффектом', async () => {
    render(
      <ChatWindow
        open
        onClose={() => undefined}
        title="Чат"
        messages={[]}
        seedDraft="Хочу отклонить коммерческое предложение. Причина: "
      />,
    );

    await waitFor(() => {
      const field = screen.getByRole('textbox');
      expect(field).toHaveValue('Хочу отклонить коммерческое предложение. Причина: ');
    });
  });
});
