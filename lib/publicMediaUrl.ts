import { getServerApiBase } from './serverApiBase';

function originFromApiBase(base: string): string {
  try {
    return new URL(base).origin;
  } catch {
    return 'http://127.0.0.1:3001';
  }
}

const PLACEHOLDER = '/images/placeholder.svg';

/** Абсолютный URL медиа для отдачи из серверных компонентов / RSC. */
export function resolveMediaUrlForServer(url: string | null | undefined): string {
  if (!url?.trim()) return PLACEHOLDER;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  const origin = originFromApiBase(getServerApiBase());
  if (u.startsWith('/')) return `${origin}${u}`;
  return `${origin}/${u}`;
}

/** Тот же смысл, что и для сервера, но origin из `NEXT_PUBLIC_API_URL` (браузер). */
export function resolveMediaUrlForClient(url: string | null | undefined): string {
  if (!url?.trim()) return PLACEHOLDER;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  const base =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'http://localhost:3001/api/v1';
  const origin = originFromApiBase(base);
  if (u.startsWith('/')) return `${origin}${u}`;
  return `${origin}/${u}`;
}
