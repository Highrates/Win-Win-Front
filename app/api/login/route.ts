import { getServerApiBase } from '@/lib/serverApiBase';
import { normalizeLoginEmailOrPhone } from '@/lib/loginEmailOrPhoneNormalize';
import { establishUserSessionResponse } from '@/lib/userSessionEstablish';
import { forwardClientIpHeaders } from '@/lib/forwardClientIpHeaders';
import { guestAuthError, readUpstreamErrorMessage } from '@/lib/guestAuthResponse';

export async function POST(request: Request) {
  let body: { email?: string; emailOrPhone?: string; password?: string; turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    return guestAuthError('Invalid JSON', 400, 'BAD_REQUEST');
  }

  const emailOrPhone = (body.emailOrPhone ?? body.email ?? '').trim();
  const password = (body.password ?? '').trim();
  if (!emailOrPhone || !password) {
    return guestAuthError('Укажите email и пароль', 400, 'BAD_REQUEST');
  }

  const url = `${getServerApiBase()}/auth/login`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...forwardClientIpHeaders(request),
      },
      body: JSON.stringify({
        emailOrPhone: normalizeLoginEmailOrPhone(emailOrPhone),
        password,
        ...(body.turnstileToken?.trim() ? { turnstileToken: body.turnstileToken.trim() } : {}),
      }),
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[api/login] fetch failed', url, e);
    return guestAuthError(
      'Нет связи с API. Запустите бэкенд (Nest, обычно порт 3001) и проверьте API_URL / NEXT_PUBLIC_API_URL в frontend/.env (должно оканчиваться на /api/v1).',
      502,
      'UPSTREAM',
    );
  }

  if (!res.ok) {
    if (res.status === 429) {
      return guestAuthError(
        'Слишком много попыток входа. Подождите минуту и попробуйте снова.',
        429,
        'RATE_LIMITED',
      );
    }
    if (res.status === 401) {
      return guestAuthError('Неверный email/телефон или пароль', 401, 'INVALID_CREDENTIALS');
    }
    if (res.status === 404) {
      return guestAuthError(
        'API вернуло 404: проверьте API_URL / NEXT_PUBLIC_API_URL в frontend/.env — база должна заканчиваться на /api/v1. Затем перезапустите Next.',
        502,
        'UPSTREAM',
      );
    }
    const nestMsg = await readUpstreamErrorMessage(res);
    return guestAuthError(nestMsg ?? `Ошибка API (${res.status})`, res.status);
  }

  const data = (await res.json()) as { access_token?: string };
  const token = data.access_token?.trim();
  if (!token) {
    return guestAuthError('Нет access_token в ответе API', 502, 'UPSTREAM');
  }

  return establishUserSessionResponse(request, token);
}
