import { NextResponse, type NextRequest } from 'next/server';
import { getServerApiBase, normalizeApiV1Base } from '@/lib/serverApiBase';

const MAX_BYTES = 8 * 1024 * 1024;

/** Базовые CDN/object-storage суффиксы + MEDIA_PROXY_ALLOWED_HOST_SUFFIXES (comma-separated). */
const DEFAULT_ALLOWED_HOST_SUFFIXES = [
  '.amazonaws.com',
  '.cloudfront.net',
  '.s3.amazonaws.com',
  '.storage.yandexcloud.net',
  '.selcdn.ru',
  '.cdn.digitaloceanspaces.com',
  '.digitaloceanspaces.com',
  '.b-cdn.net',
  '.googleusercontent.com',
  '.ggpht.com',
  '.imgix.net',
  '.cloudinary.com',
  '.mzstatic.com',
];

function allowedHostSuffixes(): string[] {
  const fromEnv = (process.env.MEDIA_PROXY_ALLOWED_HOST_SUFFIXES ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => (s.startsWith('.') ? s : `.${s}`));
  return [...DEFAULT_ALLOWED_HOST_SUFFIXES, ...fromEnv];
}

function collectAllowedOrigins(): Set<string> {
  const out = new Set<string>();
  const candidates = [
    process.env.API_URL,
    process.env.BACKEND_INTERNAL_URL,
    process.env.NEXT_PUBLIC_API_URL,
    getServerApiBase(),
  ];
  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    try {
      out.add(new URL(normalizeApiV1Base(raw.trim())).origin);
    } catch {
      /* skip */
    }
  }
  out.add('http://127.0.0.1:3001');
  out.add('http://localhost:3001');
  return out;
}

export function isAllowedMediaProxyTarget(target: URL): boolean {
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;
  const allowed = collectAllowedOrigins();
  if (allowed.has(target.origin)) return true;
  const host = target.hostname.toLowerCase();
  return allowedHostSuffixes().some((suffix) => host === suffix.slice(1) || host.endsWith(suffix));
}

function resolveTargetUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith('/uploads/')) {
      const origin = new URL(normalizeApiV1Base(getServerApiBase())).origin;
      return new URL(trimmed, origin);
    }
    return new URL(trimmed);
  } catch {
    return null;
  }
}

export const MEDIA_PROXY_MAX_REDIRECTS = 5;

export class MediaProxyRedirectDeniedError extends Error {
  readonly url: URL;
  constructor(url: URL) {
    super(`media-proxy redirect denied: ${url.hostname}`);
    this.name = 'MediaProxyRedirectDeniedError';
    this.url = url;
  }
}

export class MediaProxyTooManyRedirectsError extends Error {
  constructor() {
    super('media-proxy: too many redirects');
    this.name = 'MediaProxyTooManyRedirectsError';
  }
}

/**
 * fetch с redirect: 'manual' — каждый Location проверяется через allowlist
 * (иначе 302 на чужой host обходит SSRF-защиту).
 */
export async function fetchMediaWithAllowedRedirects(
  start: URL,
  init?: Omit<RequestInit, 'redirect'>,
  opts?: { maxRedirects?: number; fetchImpl?: typeof fetch },
): Promise<Response> {
  const maxRedirects = opts?.maxRedirects ?? MEDIA_PROXY_MAX_REDIRECTS;
  const doFetch = opts?.fetchImpl ?? fetch;
  let current = start;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!isAllowedMediaProxyTarget(current)) {
      throw new MediaProxyRedirectDeniedError(current);
    }
    const res = await doFetch(current.toString(), {
      ...init,
      redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc?.trim()) {
        return res;
      }
      let next: URL;
      try {
        next = new URL(loc, current);
      } catch {
        throw new MediaProxyRedirectDeniedError(current);
      }
      current = next;
      continue;
    }
    return res;
  }
  throw new MediaProxyTooManyRedirectsError();
}

/**
 * Same-origin прокси картинок для jsPDF/canvas (обходит CORS при сборке КП PDF).
 * Разрешены uploads бэкенда и известные CDN-хосты (+ env allowlist).
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) {
    return new NextResponse('Missing url', { status: 400 });
  }
  const target = resolveTargetUrl(raw);
  if (!target || !isAllowedMediaProxyTarget(target)) {
    console.warn('[media-proxy] denied', target?.hostname ?? raw.slice(0, 120));
    return new NextResponse('URL not allowed', {
      status: 403,
      headers: { 'x-media-proxy-reason': 'denied' },
    });
  }

  let upstream: Response;
  try {
    upstream = await fetchMediaWithAllowedRedirects(target, {
      headers: { Accept: 'image/*,*/*' },
      cache: 'force-cache',
    });
  } catch (e) {
    if (e instanceof MediaProxyRedirectDeniedError) {
      console.warn('[media-proxy] redirect denied', e.url.hostname);
      return new NextResponse('URL not allowed', {
        status: 403,
        headers: { 'x-media-proxy-reason': 'redirect_denied' },
      });
    }
    if (e instanceof MediaProxyTooManyRedirectsError) {
      console.warn('[media-proxy] too many redirects', target.hostname);
      return new NextResponse('Too many redirects', {
        status: 502,
        headers: { 'x-media-proxy-reason': 'too_many_redirects' },
      });
    }
    console.warn('[media-proxy] upstream unavailable', target.hostname, e);
    return new NextResponse('Upstream unavailable', {
      status: 502,
      headers: { 'x-media-proxy-reason': 'upstream_unavailable' },
    });
  }

  if (!upstream.ok) {
    console.warn('[media-proxy] upstream error', target.hostname, upstream.status);
    return new NextResponse('Upstream error', {
      status: upstream.status === 404 ? 404 : 502,
      headers: { 'x-media-proxy-reason': 'upstream_error' },
    });
  }

  const contentType = upstream.headers.get('content-type') ?? '';
  if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
    console.warn('[media-proxy] not an image', target.hostname, contentType);
    return new NextResponse('Not an image', {
      status: 415,
      headers: { 'x-media-proxy-reason': 'not_image' },
    });
  }

  const buf = await upstream.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    console.warn('[media-proxy] too large', target.hostname, buf.byteLength);
    return new NextResponse('Image too large', {
      status: 413,
      headers: { 'x-media-proxy-reason': 'too_large' },
    });
  }

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'content-type': contentType.startsWith('image/') ? contentType : 'image/jpeg',
      'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
      'x-content-type-options': 'nosniff',
    },
  });
}
