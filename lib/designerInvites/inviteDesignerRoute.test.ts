import { describe, expect, it, vi } from 'vitest';
import { buildDesignerInviteConfirmPath } from '@/lib/authRedirect';
import { resolveDesignerInviteRedirect } from './inviteDesignerRoute';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('resolveDesignerInviteRedirect', () => {
  it('есть сессия → экран подтверждения', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/designer-invite/verify')) {
        return jsonResponse(200, {
          email: 'partner@example.com',
          accountKind: 'customer',
          prefillRef: 'REF9',
        });
      }
      if (url.endsWith('/auth/me')) {
        return jsonResponse(200, { email: 'partner@example.com' });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const target = await resolveDesignerInviteRedirect('invite-tok', {
      siteOrigin: 'https://wupapa.test',
      apiBase: 'https://api.wupapa.test',
      accessToken: 'access-tok',
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(target.href).toBe(
      new URL(buildDesignerInviteConfirmPath('invite-tok'), 'https://wupapa.test').href,
    );
  });

  it('сессия с другим email → mismatch', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/designer-invite/verify')) {
        return jsonResponse(200, {
          email: 'invitee@example.com',
          accountKind: 'none',
        });
      }
      if (url.endsWith('/auth/me')) {
        return jsonResponse(200, { email: 'other@example.com' });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const target = await resolveDesignerInviteRedirect('invite-tok', {
      siteOrigin: 'https://wupapa.test',
      apiBase: 'https://api.wupapa.test',
      accessToken: 'access-tok',
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(target.pathname).toBe('/invite/designer/mismatch');
    expect(target.searchParams.get('t')).toBe('invite-tok');
    expect(target.searchParams.get('sessionEmail')).toBeNull();
    expect(target.searchParams.get('inviteEmail')).toBeNull();
  });

  it('сессия без email → mismatch только с t', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/designer-invite/verify')) {
        return jsonResponse(200, { email: 'invitee@example.com', accountKind: 'none' });
      }
      if (url.endsWith('/auth/me')) {
        return jsonResponse(200, { email: null, phone: '+79001234567' });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const target = await resolveDesignerInviteRedirect('invite-tok', {
      siteOrigin: 'https://wupapa.test',
      apiBase: 'https://api.wupapa.test',
      accessToken: 'access-tok',
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(target.pathname).toBe('/invite/designer/mismatch');
    expect(target.searchParams.get('t')).toBe('invite-tok');
    expect(target.searchParams.get('reason')).toBeNull();
    expect(target.searchParams.get('sessionEmail')).toBeNull();
  });

  it('сбой verify → логин с ошибкой и токеном', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });

    const target = await resolveDesignerInviteRedirect('invite-tok', {
      siteOrigin: 'https://wupapa.test',
      apiBase: 'https://api.wupapa.test',
      accessToken: null,
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(target.pathname).toBe('/login/email');
    expect(target.searchParams.get('designerInvite')).toBe('invite-tok');
    expect(target.searchParams.get('designerInviteError')).toMatch(/проверить приглашение/i);
  });

  it('без сессии и без аккаунта → register/email с токеном', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/designer-invite/verify')) {
        return jsonResponse(200, {
          email: 'new@example.com',
          accountKind: 'none',
          prefillRef: 'R1',
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const target = await resolveDesignerInviteRedirect('invite-tok', {
      siteOrigin: 'https://wupapa.test',
      apiBase: 'https://api.wupapa.test',
      accessToken: null,
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(target.pathname).toBe('/register/email');
    expect(target.searchParams.get('designerInvite')).toBe('invite-tok');
    expect(target.searchParams.get('prefillEmail')).toBe('new@example.com');
    expect(target.searchParams.get('ref')).toBeNull();
    expect(target.searchParams.get('r')).toBeNull();
  });

  it('несовпадение email + accountKind none → после выхода регистрация (не login existing)', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/designer-invite/verify')) {
        return jsonResponse(200, {
          email: 'new@example.com',
          accountKind: 'none',
          prefillRef: 'R1',
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    /** Как после «Выйти и продолжить» на mismatch: сессии нет. */
    const target = await resolveDesignerInviteRedirect('invite-tok', {
      siteOrigin: 'https://wupapa.test',
      apiBase: 'https://api.wupapa.test',
      accessToken: null,
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(target.pathname).toBe('/register/email');
    expect(target.searchParams.get('inviteExisting')).toBeNull();
    expect(target.pathname).not.toBe('/login/email');
  });
});
