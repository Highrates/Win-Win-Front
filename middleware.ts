import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/adminAuth';

const HERO_ROTATION_COOKIE = 'winwin-hero-idx';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const curRaw = request.cookies.get(HERO_ROTATION_COOKIE)?.value ?? '0';
    const cur = Number.parseInt(curRaw, 10);
    const next = Number.isFinite(cur) && cur >= 0 ? cur + 1 : 1;
    const res = NextResponse.next();
    res.cookies.set(HERO_ROTATION_COOKIE, String(next), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin', '/admin/:path*'],
};
