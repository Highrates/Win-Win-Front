import { headers } from 'next/headers';

function normalizeSiteOrigin(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
}

function isLocalHost(host: string): boolean {
  const h = host.toLowerCase();
  return h.startsWith('localhost') || h.startsWith('127.0.0.1') || h.startsWith('[::1]');
}

/** Явный публичный URL витрины (как на бэке для писем). */
export function getPublicSiteOriginFromEnv(): string | null {
  return (
    normalizeSiteOrigin(process.env.FRONTEND_PUBLIC_URL) ??
    normalizeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL)
  );
}

/**
 * Origin для редиректов и абсолютных ссылок на SSR.
 * На проде за nginx `request.url` часто `http://127.0.0.1:3000` — не используем его напрямую.
 */
export async function getServerRequestOrigin(): Promise<string> {
  const fromEnv = getPublicSiteOriginFromEnv();
  if (fromEnv) return fromEnv;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  try {
    const h = await headers();
    const host = (h.get('x-forwarded-host') ?? h.get('host'))?.split(',')[0]?.trim();
    const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'http';
    if (host && !isLocalHost(host)) return `${proto}://${host}`;
  } catch {
    /* headers() вне запроса */
  }
  const port = process.env.PORT ?? '3000';
  return `http://127.0.0.1:${port}`;
}
