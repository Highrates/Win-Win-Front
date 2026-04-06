import { headers } from 'next/headers';

/**
 * Базовый origin текущего запроса (SSR), чтобы ходить в локальные Route Handlers.
 * Fallback для dev без заголовков — порт Next по умолчанию.
 */
export async function getServerRequestOrigin(): Promise<string> {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'http';
    if (host) return `${proto}://${host}`;
  } catch {
    /* headers() вне запроса */
  }
  const port = process.env.PORT ?? '3000';
  return `http://127.0.0.1:${port}`;
}
