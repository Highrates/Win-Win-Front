import {
  buildDesignerInviteProfilePath,
  defaultPostAuthPath,
  type PostAuthUser,
  sanitizeCallbackUrl,
} from '@/lib/authRedirect';
import { invalidateUserClientCaches } from '@/lib/userSessionClient';

export type NavigateAfterUserAuthResult = { ok: true } | { ok: false; error: string };

async function claimDesignerInvite(token: string): Promise<
  { ok: true; prefillRef?: string } | { ok: false; error: string }
> {
  const res = await fetch('/api/user/designer-invite/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ token }),
    credentials: 'same-origin',
  });
  const body = (await res.json().catch(() => ({}))) as { prefillRef?: string; message?: string };
  if (!res.ok) {
    const msg =
      typeof body.message === 'string' && body.message.trim()
        ? body.message
        : 'Не удалось применить приглашение';
    return { ok: false, error: msg };
  }
  return { ok: true, prefillRef: body.prefillRef };
}

/** Hard navigation — не зависит от soft RSC / чужого `_rsc`-шторма в `next dev`. */
function hardNavigate(path: string): void {
  if (typeof window === 'undefined') return;
  window.location.replace(path);
}

/**
 * После успешного login/register: кэши, claim invite (если есть), hard redirect.
 */
export async function navigateAfterUserAuth(opts: {
  callbackUrl?: string | null;
  user?: PostAuthUser | null;
  designerInviteToken?: string | null;
  fallbackPath?: string;
}): Promise<NavigateAfterUserAuthResult> {
  invalidateUserClientCaches({ authenticated: true });

  const invite = opts.designerInviteToken?.trim();
  if (invite) {
    const claimed = await claimDesignerInvite(invite);
    if (!claimed.ok) return claimed;
    hardNavigate(buildDesignerInviteProfilePath(claimed.prefillRef));
    return { ok: true };
  }

  const target = sanitizeCallbackUrl(
    opts.callbackUrl,
    opts.fallbackPath ?? defaultPostAuthPath(opts.user),
  );
  hardNavigate(target);
  return { ok: true };
}
