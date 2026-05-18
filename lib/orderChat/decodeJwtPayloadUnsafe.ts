/** Декодирует payload JWT без проверки подписи (только для UI / WS после выдачи токена через BFF). */
export function decodeJwtPayloadUnsafe(
  token: string,
): { sub?: string; role?: string; exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad === 2) b64 += '==';
    else if (pad === 3) b64 += '=';
    const json = atob(b64);
    const o = JSON.parse(json) as { sub?: string; role?: string; exp?: number; iat?: number };
    return o && typeof o === 'object' ? o : null;
  } catch {
    return null;
  }
}

/** `exp` в JWT — секунды с epoch; для планирования обновления WS. */
export function jwtExpiresAtMs(token: string): number | null {
  const exp = decodeJwtPayloadUnsafe(token)?.exp;
  if (exp == null || typeof exp !== 'number' || !Number.isFinite(exp)) return null;
  return exp * 1000;
}
