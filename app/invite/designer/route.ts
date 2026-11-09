import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { getServerRequestOrigin } from '@/lib/serverRequestOrigin';
import { getServerUserSession } from '@/lib/userSessionServer';
import { resolveDesignerInviteRedirect } from '@/lib/designerInvites/inviteDesignerRoute';

/** Серверный редирект по ссылке из письма — без промежуточного лендинга. */
export async function GET(request: Request) {
  const siteOrigin = await getServerRequestOrigin();
  const requestUrl = new URL(request.url);
  const t = requestUrl.searchParams.get('t')?.trim();
  if (!t) {
    return NextResponse.redirect(new URL('/login/email', siteOrigin));
  }

  const session = await getServerUserSession();
  const target = await resolveDesignerInviteRedirect(t, {
    siteOrigin,
    apiBase: getServerApiBase(),
    accessToken: session.accessToken,
  });
  return NextResponse.redirect(target);
}
