import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Серверный редирект по ссылке из письма — без промежуточного лендинга. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const t = requestUrl.searchParams.get('t')?.trim();
  if (!t) {
    return NextResponse.redirect(new URL('/login/email', requestUrl.origin));
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
    return NextResponse.redirect(new URL('/login/email', requestUrl.origin));
  }

  const body = (await res.json().catch(() => ({}))) as {
    message?: string;
    prefillRef?: string;
    accountExists?: boolean;
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
    return NextResponse.redirect(new URL(`/login/email?${q.toString()}`, requestUrl.origin));
  }

  if (body.accountExists) {
    const q = new URLSearchParams();
    q.set('designerInvite', t);
    const email = (body.email ?? '').trim();
    if (email) q.set('prefillEmail', email);
    return NextResponse.redirect(new URL(`/login/email?${q.toString()}`, requestUrl.origin));
  }

  const q = new URLSearchParams();
  const prefillRef = (body.prefillRef ?? '').trim();
  if (prefillRef) q.set('ref', prefillRef);
  q.set('designerInvite', t);
  const email = (body.email ?? '').trim();
  if (email) q.set('prefillEmail', email);
  return NextResponse.redirect(new URL(`/register/email?${q.toString()}`, requestUrl.origin));
}
