import {
  buildDesignerInviteEntryPath,
  defaultPostAuthPath,
  type PostAuthUser,
  sanitizeCallbackUrl,
} from '@/lib/authRedirect';
import { invalidateUserClientCaches } from '@/lib/userSessionClient';

export type NavigateAfterUserAuthResult = { ok: true } | { ok: false; error: string };

/** Hard navigation — не зависит от soft RSC / чужого `_rsc`-шторма в `next dev`. */
function hardNavigate(path: string): void {
  if (typeof window === 'undefined') return;
  window.location.replace(path);
}

/**
 * После успешного login/register: кэши, затем invite entry (mismatch/confirm) или обычный redirect.
 * Не claim-им на странице логина — иначе при чужом аккаунте человек «застревает» с cookie.
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
    hardNavigate(buildDesignerInviteEntryPath(invite));
    return { ok: true };
  }

  const target = sanitizeCallbackUrl(
    opts.callbackUrl,
    opts.fallbackPath ?? defaultPostAuthPath(opts.user),
  );
  hardNavigate(target);
  return { ok: true };
}
