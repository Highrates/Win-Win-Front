/** Должен совпадать с `JWT_EXPIRES_IN` на Nest (по умолчанию `7d`). */
const DEFAULT_USER_JWT_EXPIRES_IN = '7d';

/** Парсинг строки срока как у Nest/jsonwebtoken: `7d`, `12h`, `3600` (секунды). */
export function parseJwtExpiresInToSeconds(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) {
    const n = Number.parseInt(t, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const m = /^(\d+)\s*([dhms])$/i.exec(t);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  switch (m[2].toLowerCase()) {
    case 'd':
      return n * 86_400;
    case 'h':
      return n * 3_600;
    case 'm':
      return n * 60;
    case 's':
      return n;
    default:
      return null;
  }
}

/**
 * maxAge httpOnly-cookie покупателя (секунды).
 * Приоритет: `USER_TOKEN_MAX_AGE_SEC` → `USER_JWT_EXPIRES_IN` → `7d`.
 * На проде держите в sync с `JWT_EXPIRES_IN` бэка.
 */
export function getUserTokenMaxAgeSec(): number {
  const secRaw = process.env.USER_TOKEN_MAX_AGE_SEC?.trim();
  if (secRaw && /^\d+$/.test(secRaw)) {
    const n = Number.parseInt(secRaw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const durRaw = process.env.USER_JWT_EXPIRES_IN?.trim() || DEFAULT_USER_JWT_EXPIRES_IN;
  const parsed = parseJwtExpiresInToSeconds(durRaw);
  if (parsed != null) return parsed;
  return 7 * 86_400;
}

/** @deprecated Используйте `getUserTokenMaxAgeSec()` — значение зависит от env. */
export const USER_TOKEN_MAX_AGE_SEC = 7 * 86_400;
