import { NextResponse } from 'next/server';
import { clearUserSessionCookieInResponse } from '@/lib/userSessionServer';

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  clearUserSessionCookieInResponse(res, request);
  return res;
}
