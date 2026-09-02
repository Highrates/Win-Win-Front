import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { forwardClientIpHeaders } from '@/lib/forwardClientIpHeaders';
import { guestAuthError } from '@/lib/guestAuthResponse';

/** Guest: verify designer invite JWT (pre-register / pre-login). */
export async function POST(request: Request) {
  const url = `${getServerApiBase()}/auth/designer-invite/verify`;
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
    console.error('[api/auth/designer-invite/verify]', e);
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
      return guestAuthError(msg, res.status);
    } catch {
      return guestAuthError(text.trim() || `Ошибка ${res.status}`, res.status);
    }
  }
  const out = new NextResponse(text, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}
