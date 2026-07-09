import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/adminAuth';
import { getAdminStaffSession } from '@/lib/adminPermissions/getAdminStaffSession';
import { clearAdminAccessTokenCookieInResponse } from '@/lib/adminSessionServer';

/** Проверка cookie и валидности сессии на бэкенде. */
export async function GET(request: Request) {
  const token = cookies().get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const session = await getAdminStaffSession();
  if (!session.authenticated) {
    if (session.error === 'api_unreachable') {
      return NextResponse.json({ authenticated: false, error: 'api_unreachable' });
    }
    const out = NextResponse.json({ authenticated: false });
    clearAdminAccessTokenCookieInResponse(out, request);
    return out;
  }

  return NextResponse.json({ authenticated: true, user: session.user });
}
