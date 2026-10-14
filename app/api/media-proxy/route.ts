import { NextResponse, type NextRequest } from 'next/server';
import { getServerApiBase, normalizeApiV1Base } from '@/lib/serverApiBase';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_HOST_SUFFIXES = ['.amazonaws.com', '.cloudfront.net', '.s3.amazonaws.com'];

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

function isAllowedTarget(target: URL): boolean {
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;
  const allowed = collectAllowedOrigins();
  if (allowed.has(target.origin)) return true;
  const host = target.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
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

/**
 * Same-origin прокси картинок для jsPDF/canvas (обходит CORS при сборке КП PDF).
 * Разрешены только uploads бэкенда и известные CDN-хосты.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) {
    return new NextResponse('Missing url', { status: 400 });
  }
  const target = resolveTargetUrl(raw);
  if (!target || !isAllowedTarget(target)) {
    return new NextResponse('URL not allowed', { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: { Accept: 'image/*,*/*' },
      cache: 'force-cache',
      redirect: 'follow',
    });
  } catch {
    return new NextResponse('Upstream unavailable', { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse('Upstream error', { status: upstream.status === 404 ? 404 : 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? '';
  if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
    return new NextResponse('Not an image', { status: 415 });
  }

  const buf = await upstream.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return new NextResponse('Image too large', { status: 413 });
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
