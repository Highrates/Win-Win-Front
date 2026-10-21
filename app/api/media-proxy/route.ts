import { NextResponse, type NextRequest } from 'next/server';
import {
  fetchMediaWithAllowedRedirects,
  isAllowedMediaProxyTarget,
  MediaProxyRedirectDeniedError,
  MediaProxyTooManyRedirectsError,
  resolveMediaProxyTargetUrl,
} from './mediaProxyCore';

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Same-origin прокси картинок для jsPDF/canvas (обходит CORS при сборке КП PDF).
 * Разрешены uploads бэкенда и известные CDN-хосты (+ env allowlist).
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) {
    return new NextResponse('Missing url', { status: 400 });
  }
  const target = resolveMediaProxyTargetUrl(raw);
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
