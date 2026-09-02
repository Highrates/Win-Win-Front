import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { forwardClientIpHeaders } from '@/lib/forwardClientIpHeaders';
import { guestAuthError } from '@/lib/guestAuthResponse';

/** Proxy guest password-reset POSTs → Nest with unified `{ message, code? }` errors. */
export async function proxyPasswordResetPost(
  request: Request,
  backendPath: 'password-reset/request' | 'password-reset/verify' | 'password-reset/confirm',
): Promise<NextResponse> {
  const url = `${getServerApiBase()}/auth/${backendPath}`;
  let body: string;
  try {
    body = await request.text();
  } catch {
    return guestAuthError('Bad request', 400, 'BAD_REQUEST');
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...forwardClientIpHeaders(request),
      },
      body: body || '{}',
      cache: 'no-store',
    });
  } catch (e) {
    console.error(`[api/${backendPath}]`, e);
    return guestAuthError('API unreachable', 502, 'UPSTREAM');
  }
  const text = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { message?: string | string[]; error?: string };
      const msg = Array.isArray(j.message)
        ? j.message.join(', ')
        : typeof j.message === 'string'
          ? j.message
          : typeof j.error === 'string'
            ? j.error
            : text.trim() || `Ошибка ${res.status}`;
      const code = res.status === 429 ? 'RATE_LIMITED' : undefined;
      return guestAuthError(msg, res.status, code);
    } catch {
      return guestAuthError(text.trim() || `Ошибка ${res.status}`, res.status);
    }
  }
  const out = new NextResponse(text, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}
