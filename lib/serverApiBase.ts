/**
 * Нормализует базу API: часто задают только `http://host:3001` без суффикса `/api/v1`.
 */
export function normalizeApiV1Base(raw: string): string {
  const t = raw.replace(/\/+$/, '');
  if (/\/api\/v\d+$/i.test(t)) return t;
  /** `http://host:3001/api` без версии → Nest ждёт `/api/v1/...`, иначе 404 Not Found. */
  if (/\/api$/i.test(t)) return `${t}/v1`;
  if (/^https?:\/\/[^/]+$/i.test(t)) return `${t}/api/v1`;
  return t;
}

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
  return normalizeApiV1Base(raw);
}
