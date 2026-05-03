import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/adminAuth';

const HERO_ROTATION_COOKIE = 'winwin-hero-idx';

/**
 * Абсолютные URL медиа с бэкенда (uploads) часто идут как http://127.0.0.1:3001/...
 * В CSP `https:` их не покрывает; `'self'` — только origin фронта (Next).
 * Собираем origin из тех же переменных, что и API, плюс типичные dev-хосты.
 */
function backendOriginsForCsp(): string {
  const origins = new Set<string>();
  for (const key of ['NEXT_PUBLIC_API_URL', 'API_URL', 'BACKEND_INTERNAL_URL'] as const) {
    const v = process.env[key];
    if (!v?.trim()) continue;
    try {
      origins.add(new URL(v.trim()).origin);
    } catch {
      /* ignore */
    }
  }
  if (process.env.NODE_ENV === 'development') {
    origins.add('http://127.0.0.1:3001');
    origins.add('http://localhost:3001');
  }
  return Array.from(origins).join(' ');
}

function publicVitrineCsp(): string {
  const extra = backendOriginsForCsp();
  const img = extra
    ? `img-src 'self' https: data: blob: ${extra}`
    : "img-src 'self' https: data: blob:";
  const media = extra ? `media-src 'self' https: ${extra}` : "media-src 'self' https:";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    img,
    media,
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src 'self' https:",
  ].join('; ');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/designers') || pathname.startsWith('/projects')) {
    const res = NextResponse.next();
    res.headers.set('Content-Security-Policy', publicVitrineCsp());
    return res;
  }

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
  matcher: ['/', '/designers/:path*', '/projects', '/projects/:path*', '/admin', '/admin/:path*'],
};
