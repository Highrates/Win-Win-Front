import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InviteDesignerModal } from './InviteDesignerModal';

vi.mock('@/components/SlideInPanelModal/SlideInPanelModal', () => ({
  SlideInPanelModal: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div data-testid="invite-panel">{children}</div> : null),
  slideInPanelModalStyles: {
    inner: 'inner',
    title: 'title',
    actions: 'actions',
  },
}));

vi.mock('./PartnerReferralLinkTab', () => ({
  PartnerReferralLinkTab: () => null,
}));

vi.mock('@/lib/copyToClipboard', () => ({
  copyTextToClipboard: vi.fn(),
}));

describe('InviteDesignerModal onSent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('после успеха fetch списка вызывается ровно один раз (даже при смене onSent)', async () => {
    const listFetch = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/api/user/designer-invite') && init?.method === 'POST') {
          return new Response(
            JSON.stringify({
              ok: true,
              emailSent: true,
              inviteLink: 'https://wupapa.test/invite/designer?t=tok',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        throw new Error(`unexpected fetch ${url}`);
      }),
    );

    const { rerender } = render(
      <InviteDesignerModal
        open
        onClose={() => undefined}
        referralCode="REF1"
        onSent={() => {
          listFetch();
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'guest@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить приглашение' }));

    await waitFor(() => {
      expect(screen.getByText(/Приглашение отправлено/)).toBeInTheDocument();
    });
    expect(listFetch).toHaveBeenCalledTimes(1);

    rerender(
      <InviteDesignerModal
        open
        onClose={() => undefined}
        referralCode="REF1"
        onSent={() => {
          listFetch();
        }}
      />,
    );
    rerender(
      <InviteDesignerModal
        open
        onClose={() => undefined}
        referralCode="REF1"
        onSent={() => {
          listFetch();
        }}
      />,
    );

    expect(listFetch).toHaveBeenCalledTimes(1);
  });
});
