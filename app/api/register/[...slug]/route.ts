import { NextRequest, NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { establishUserSessionFromAuthJson } from '@/lib/userSessionEstablish';
import { forwardClientIpHeaders } from '@/lib/forwardClientIpHeaders';
import { guestAuthError } from '@/lib/guestAuthResponse';

function isAllowed(slug: string[]): boolean {
  const s = slug.filter((p) => p.length > 0);
  if (s.length === 1 && s[0] === 'complete') return true;
  if (s.length === 2 && s[0] === 'phone' && (s[1] === 'start' || s[1] === 'verify')) return true;
  if (s.length === 2 && s[0] === 'email' && (s[1] === 'start' || s[1] === 'verify')) return true;
  return false;
}

function isRegisterComplete(slug: string[]): boolean {
  const s = slug.filter((p) => p.length > 0);
  return s.length === 1 && s[0] === 'complete';
}

async function readNestError(
  buf: ArrayBuffer,
): Promise<{ message: string; code?: string } | null> {
  try {
    const errBody = JSON.parse(new TextDecoder().decode(buf)) as {
      message?: string | string[];
      code?: string;
    };
    let message: string | null = null;
    if (Array.isArray(errBody.message)) message = errBody.message.join(', ');
    else if (typeof errBody.message === 'string') message = errBody.message;
    if (!message?.trim()) return null;
    const code =
      typeof errBody.code === 'string' && errBody.code.trim()
        ? errBody.code.trim()
        : undefined;
    return { message: message.trim(), code };
  } catch {
    /* empty */
  }
  return null;
}

export async function POST(request: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug ?? [];
  if (!isAllowed(slug)) {
    return guestAuthError('Forbidden', 403, 'FORBIDDEN');
  }

  const path = `auth/register/${slug.join('/')}`;
  const url = new URL(request.url);
  const target = `${getServerApiBase()}/${path}${url.search}`;

  let body: ArrayBuffer;
  try {
    body = await request.arrayBuffer();
  } catch {
    return guestAuthError('Bad Request', 400, 'BAD_REQUEST');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': request.headers.get('content-type') || 'application/json',
    ...forwardClientIpHeaders(request),
  };

  let res: Response;
  try {
    res = await fetch(target, {
      method: 'POST',
      headers,
      body: body.byteLength > 0 ? body : '{}',
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upstream unreachable';
    return guestAuthError(`Не удалось связаться с API: ${msg}`, 502, 'UPSTREAM');
  }

  if (res.status >= 300 && res.status < 400) {
    return guestAuthError(
      'API вернуло перенаправление; проверьте API_URL (нужен прямой URL Nest).',
      502,
      'UPSTREAM',
    );
  }

  const buf = await res.arrayBuffer();

  if (isRegisterComplete(slug) && res.ok) {
    return establishUserSessionFromAuthJson(request, new TextDecoder().decode(buf));
  }

  if (!res.ok) {
    const nestErr = await readNestError(buf);
    if (nestErr) {
      const code = res.status === 429 ? 'RATE_LIMITED' : nestErr.code;
      return guestAuthError(nestErr.message, res.status, code);
    }
    return guestAuthError(`Ошибка API (${res.status})`, res.status);
  }

  const out = new NextResponse(buf, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}
