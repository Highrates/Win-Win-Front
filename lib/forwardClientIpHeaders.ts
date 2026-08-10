/**
 * Проброс IP клиента в Nest при server-side fetch (BFF → API).
 * Без этого ThrottlerGuard видит только IP Next.js.
 */
export function forwardClientIpHeaders(request: Request): Record<string, string> {
  const xff = request.headers.get('x-forwarded-for')?.trim();
  const xri = request.headers.get('x-real-ip')?.trim();
  const cf = request.headers.get('cf-connecting-ip')?.trim();

  const clientIp = xff?.split(',')[0]?.trim() || xri || cf;
  if (!clientIp) return {};

  return {
    'x-forwarded-for': clientIp,
    'x-real-ip': clientIp,
  };
}
