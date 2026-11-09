import { buildDesignerInviteConfirmPath } from '@/lib/authRedirect';
import {
  buildInviteMismatchPath,
  buildLoginWithInviteHref,
  DESIGNER_INVITE_STAFF_EMAIL_ERROR,
} from '@/lib/designerInvites/loginHints';

export type DesignerInviteVerifyBody = {
  message?: string;
  prefillRef?: string;
  accountExists?: boolean;
  accountKind?: 'none' | 'customer' | 'staff';
  email?: string;
};

export type InviteDesignerRouteDeps = {
  siteOrigin: string;
  apiBase: string;
  accessToken: string | null;
  fetchImpl?: typeof fetch;
};

function abs(siteOrigin: string, path: string): URL {
  return new URL(path, siteOrigin);
}

function loginErrorUrl(
  siteOrigin: string,
  message: string,
  opts: { email?: string; token?: string },
): URL {
  const q = new URLSearchParams();
  q.set('designerInviteError', message);
  if (opts.token?.trim()) q.set('designerInvite', opts.token.trim());
  if (opts.email?.trim()) q.set('prefillEmail', opts.email.trim());
  return abs(siteOrigin, `/login/email?${q.toString()}`);
}

/** Нормализация email для сравнения сессии и приглашения. */
export function normalizeInviteEmail(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase();
}

/**
 * Редирект после `/invite/designer?t=…`.
 * Если есть сессия с тем же email — экран подтверждения «войдёте в команду X».
 * Иначе login/register (или mismatch при другом email / аккаунте без email).
 */
export async function resolveDesignerInviteRedirect(
  token: string,
  deps: InviteDesignerRouteDeps,
): Promise<URL> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const t = token.trim();
  if (!t) {
    return loginErrorUrl(deps.siteOrigin, 'В ссылке нет токена приглашения', {});
  }

  let verifyRes: Response;
  try {
    verifyRes = await fetchImpl(`${deps.apiBase}/auth/designer-invite/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ token: t }),
      cache: 'no-store',
    });
  } catch {
    return loginErrorUrl(
      deps.siteOrigin,
      'Не удалось проверить приглашение. Проверьте интернет и откройте ссылку из письма снова.',
      { token: t },
    );
  }

  const body = (await verifyRes.json().catch(() => ({}))) as DesignerInviteVerifyBody;
  const inviteEmail = normalizeInviteEmail(body.email);

  if (!verifyRes.ok) {
    return loginErrorUrl(
      deps.siteOrigin,
      typeof body.message === 'string' && body.message.trim()
        ? body.message.trim()
        : 'Ссылка приглашения недействительна или истекла',
      { email: inviteEmail || undefined, token: t },
    );
  }

  const kind = body.accountKind ?? (body.accountExists ? 'customer' : 'none');

  if (kind === 'staff') {
    return loginErrorUrl(deps.siteOrigin, DESIGNER_INVITE_STAFF_EMAIL_ERROR, {
      email: inviteEmail || undefined,
      token: t,
    });
  }

  if (deps.accessToken) {
    let sessionEmail = '';
    let meOk = false;
    try {
      const meRes = await fetchImpl(`${deps.apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${deps.accessToken}`, Accept: 'application/json' },
        cache: 'no-store',
      });
      if (meRes.ok) {
        meOk = true;
        const me = (await meRes.json().catch(() => ({}))) as {
          email?: string | null;
          phone?: string | null;
        };
        sessionEmail = normalizeInviteEmail(me.email);
        if (!sessionEmail && inviteEmail) {
          return abs(deps.siteOrigin, buildInviteMismatchPath(t));
        }
      }
    } catch {
      /* fall through */
    }

    if (meOk && sessionEmail && inviteEmail && sessionEmail !== inviteEmail) {
      return abs(deps.siteOrigin, buildInviteMismatchPath(t));
    }

    if (meOk && sessionEmail && (!inviteEmail || sessionEmail === inviteEmail)) {
      return abs(deps.siteOrigin, buildDesignerInviteConfirmPath(t));
    }

    /** Сессия есть, но /me не ответил — не ведём на guest login (иначе «застрял» с cookie). */
    if (!meOk && inviteEmail) {
      return abs(deps.siteOrigin, buildInviteMismatchPath(t));
    }
  }

  if (kind === 'customer' || body.accountExists) {
    return abs(
      deps.siteOrigin,
      buildLoginWithInviteHref({ token: t, email: inviteEmail || body.email, existing: true }),
    );
  }

  /** Код спонсора не кладём в ?ref=: complete() берёт его из приглашения.
   * Иначе при отзыве/замене токена ref остаётся и всё равно привязывает к команде. */
  const q = new URLSearchParams();
  q.set('designerInvite', t);
  if (inviteEmail) q.set('prefillEmail', inviteEmail);
  return abs(deps.siteOrigin, `/register/email?${q.toString()}`);
}
