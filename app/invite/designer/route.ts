import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { getServerRequestOrigin } from '@/lib/serverRequestOrigin';
import {
  buildLoginWithInviteHref,
  DESIGNER_INVITE_STAFF_EMAIL_ERROR,
} from '@/lib/designerInvites/loginHints';

/** Серверный редирект по ссылке из письма — без промежуточного лендинга. */
export async function GET(request: Request) {
  const siteOrigin = await getServerRequestOrigin();
  const requestUrl = new URL(request.url);
  const t = requestUrl.searchParams.get('t')?.trim();
  if (!t) {
    return NextResponse.redirect(new URL('/login/email', siteOrigin));
  }

  let res: Response;
  try {
    res = await fetch(`${getServerApiBase()}/auth/designer-invite/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ token: t }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.redirect(new URL('/login/email', siteOrigin));
  }

  const body = (await res.json().catch(() => ({}))) as {
    message?: string;
    prefillRef?: string;
    accountExists?: boolean;
    accountKind?: 'none' | 'customer' | 'staff';
    email?: string;
  };

  if (!res.ok) {
    const q = new URLSearchParams();
    q.set(
      'designerInviteError',
      typeof body.message === 'string' && body.message.trim()
        ? body.message.trim()
        : 'Ссылка приглашения недействительна или истекла',
    );
    return NextResponse.redirect(new URL(`/login/email?${q.toString()}`, siteOrigin));
  }

  const email = (body.email ?? '').trim();
  const kind = body.accountKind ?? (body.accountExists ? 'customer' : 'none');

  if (kind === 'staff') {
    const q = new URLSearchParams();
    q.set('designerInviteError', DESIGNER_INVITE_STAFF_EMAIL_ERROR);
    if (email) q.set('prefillEmail', email);
    return NextResponse.redirect(new URL(`/login/email?${q.toString()}`, siteOrigin));
  }

  if (kind === 'customer' || body.accountExists) {
    return NextResponse.redirect(
      new URL(buildLoginWithInviteHref({ token: t, email, existing: true }), siteOrigin),
    );
  }

  const q = new URLSearchParams();
  const prefillRef = (body.prefillRef ?? '').trim();
  if (prefillRef) q.set('ref', prefillRef);
  q.set('designerInvite', t);
  if (email) q.set('prefillEmail', email);
  return NextResponse.redirect(new URL(`/register/email?${q.toString()}`, siteOrigin));
}
