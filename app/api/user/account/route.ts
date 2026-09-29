import { NextResponse } from 'next/server';
import { proxyUserBearer } from '@/lib/userBackendJsonProxy';
import { clearUserSessionCookieInResponse } from '@/lib/userSessionServer';

/** Soft-delete своего аккаунта → Nest `DELETE users/me`, затем сброс cookie. */
export async function DELETE(request: Request) {
  const upstream = await proxyUserBearer(
    { request, backendPath: 'users/me', method: 'DELETE' },
    false,
  );
  if (upstream.status >= 200 && upstream.status < 300) {
    const res = NextResponse.json({ ok: true }, { status: 200 });
    clearUserSessionCookieInResponse(res, request);
    return res;
  }
  return upstream;
}
