/**
 * База URL API для вызовов из Route Handlers / сервера Next.
 * `API_URL` / `BACKEND_INTERNAL_URL` — приоритетнее `NEXT_PUBLIC_*` (Docker, другой host).
 */
export function getServerApiBase(): string {
  const raw =
    process.env.API_URL ??
    process.env.BACKEND_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:3001/api/v1';
  return raw.replace(/\/+$/, '');
}
