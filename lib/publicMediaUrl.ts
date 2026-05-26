import { getServerApiBase, normalizeApiV1Base } from './serverApiBase';

const PLACEHOLDER = '/images/placeholder.svg';

function collectStorageApiOrigins(): string[] {
  const candidates = [
    typeof process !== 'undefined' ? process.env.API_URL : undefined,
    typeof process !== 'undefined' ? process.env.BACKEND_INTERNAL_URL : undefined,
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined,
    getServerApiBase(),
  ];
  const out = new Set<string>();
  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    try {
      out.add(new URL(normalizeApiV1Base(raw.trim())).origin);
    } catch {
      /* skip invalid */
    }
  }
  out.add('http://127.0.0.1:3001');
  out.add('http://localhost:3001');
  return [...out];
}

/** `http://127.0.0.1:3001/uploads/...` → `/uploads/...` (тот же origin, что у Next; см. rewrite в next.config). */
function rewriteApiUploadUrlToPublicPath(u: string): string | null {
  for (const origin of collectStorageApiOrigins()) {
    const prefix = `${origin}/uploads/`;
    if (u.startsWith(prefix)) {
      return `/uploads/${u.slice(prefix.length)}`;
    }
  }
  return null;
}

function originFromApiBase(base: string): string {
  try {
    return new URL(normalizeApiV1Base(base)).origin;
  } catch {
    return 'http://127.0.0.1:3001';
  }
}

/**
 * URL для `<img>` / next/image в браузере: локальные uploads — через прокси Next (`/uploads/...`),
 * чтобы работало при открытии сайта не с 127.0.0.1 (LAN, localhost, custom host).
 */
function resolveBrowserMediaUrl(url: string | null | undefined): string {
  if (!url?.trim()) return PLACEHOLDER;
  const u = url.trim();

  const proxied = rewriteApiUploadUrlToPublicPath(u);
  if (proxied) return proxied;

  if (u.startsWith('/uploads/') || u.startsWith('/images/')) return u;

  if (/^https?:\/\//i.test(u)) return u;

  if (u.startsWith('/')) {
    const origin = originFromApiBase(getServerApiBase());
    return `${origin}${u}`;
  }

  return `/uploads/${u.replace(/^\/+/, '')}`;
}

/** @alias resolveBrowserMediaUrl — SSR/RSC отдаёт в HTML пути для браузера. */
export function resolveMediaUrlForServer(url: string | null | undefined): string {
  return resolveBrowserMediaUrl(url);
}

/** Клиентские компоненты — тот же прокси `/uploads`. */
export function resolveMediaUrlForClient(url: string | null | undefined): string {
  return resolveBrowserMediaUrl(url);
}
