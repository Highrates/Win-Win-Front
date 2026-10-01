import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamPageClient } from './TeamPageClient';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string; className?: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/account/team',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/useActiveDesignerInvites', () => ({
  useActiveDesignerInvites: () => ({
    items: [],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('@/components/InviteDesignerModal/InviteDesignerModal', () => ({
  InviteDesignerModal: () => null,
}));

vi.mock('@/lib/referrals/partnerProgramSummary', async (orig) => ({
  ...(await orig<typeof import('@/lib/referrals/partnerProgramSummary')>()),
  fetchPartnerProgramSummary: vi.fn().mockResolvedValue(null),
}));

function jsonResponse(body: unknown, init?: { status?: number; ok?: boolean }) {
  const status = init?.status ?? 200;
  const ok = init?.ok ?? (status >= 200 && status < 300);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe('TeamPageClient', () => {
  beforeEach(() => {
    replace.mockReset();
    push.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/user/winwin-team')) {
          return jsonResponse({
            inviter: null,
            counts: { total: 0, level1: 0, level2: 0 },
            l1: [],
          });
        }
        if (url.includes('/api/user/profile')) {
          return jsonResponse({ winWinReferralCode: 'ABC' });
        }
        return jsonResponse({}, { status: 404, ok: false });
      }),
    );
  });

  it('shows partner gate on 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'Forbidden' }, { status: 403, ok: false })),
    );
    render(<TeamPageClient />);
    expect(await screen.findByRole('heading', { name: 'Команда' })).toBeInTheDocument();
    expect(screen.getByText(/доступен одобренным партнёрам/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'В профиль' })).toBeInTheDocument();
  });

  it('shows empty team state when structure has no designers', async () => {
    render(<TeamPageClient />);
    expect(await screen.findByRole('heading', { name: 'Команда' })).toBeInTheDocument();
    expect(await screen.findByText('В вашей команде пока нет дизайнеров')).toBeInTheDocument();
    expect(screen.getByLabelText('Поиск по членам команды')).toBeInTheDocument();
  });

  it('filters team search with a dedicated empty message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/user/winwin-team')) {
          return jsonResponse({
            inviter: null,
            counts: { total: 1, level1: 1, level2: 0 },
            l1: [
              {
                id: 'b1',
                userId: 'u1',
                name: 'Анна Смирнова',
                city: 'Казань',
                avatarUrl: null,
                isPartner: true,
                joinedAt: '2026-01-01T00:00:00.000Z',
                l2: [],
              },
            ],
          });
        }
        if (url.includes('/api/user/profile')) {
          return jsonResponse({ winWinReferralCode: 'ABC' });
        }
        return jsonResponse({}, { status: 404, ok: false });
      }),
    );

    render(<TeamPageClient />);
    expect(await screen.findByText('Анна Смирнова')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Поиск по членам команды'), {
      target: { value: 'zzz' },
    });
    await waitFor(() => {
      expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    });
    expect(screen.queryByText('В вашей команде пока нет дизайнеров')).not.toBeInTheDocument();
  });
});
