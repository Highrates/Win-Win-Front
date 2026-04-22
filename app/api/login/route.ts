import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { USER_ACCESS_TOKEN_COOKIE, USER_TOKEN_MAX_AGE_SEC, userCookieSecure } from '@/lib/userAuth';

async function readNestError(res: Response): Promise<string | null> {
  try {
    const errBody = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(errBody.message)) return errBody.message.join(', ');
    if (typeof errBody.message === 'string') return errBody.message;
  } catch {
    /* empty */
  }
  return null;
}

export async function POST(request: Request) {
  let body: { email?: string; emailOrPhone?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const emailOrPhone = (body.emailOrPhone ?? body.email ?? '').trim();
  const password = (body.password ?? '').trim();
  if (!emailOrPhone || !password) {
    return NextResponse.json({ error: 'Укажите email и пароль' }, { status: 400 });
  }

  const url = `${getServerApiBase()}/auth/login`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        emailOrPhone: emailOrPhone.includes('@') ? emailOrPhone.toLowerCase() : emailOrPhone,
        password,
      }),
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[api/login] fetch failed', url, e);
    return NextResponse.json(
      {
        error:
          'Нет связи с API. Запустите бэкенд (Nest, обычно порт 3001) и проверьте API_URL / NEXT_PUBLIC_API_URL в frontend/.env (должно оканчиваться на /api/v1).',
      },
      { status: 502 },
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      return NextResponse.json({ error: 'Неверный email/телефон или пароль' }, { status: 401 });
    }
    if (res.status === 404) {
      return NextResponse.json(
        {
          error:
            'API вернуло 404: проверьте API_URL / NEXT_PUBLIC_API_URL в frontend/.env — база должна заканчиваться на /api/v1. Затем перезапустите Next.',
        },
        { status: 502 },
      );
    }
    const nestMsg = await readNestError(res);
    return NextResponse.json(
      { error: nestMsg ?? `Ошибка API (${res.status})` },
      { status: res.status },
    );
  }

  const data = (await res.json()) as { access_token?: string };
  const token = data.access_token;
  if (!token) {
    return NextResponse.json({ error: 'Нет access_token в ответе API' }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true, access_token: token });
  response.cookies.set({
    name: USER_ACCESS_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: userCookieSecure(request),
    sameSite: 'lax',
    path: '/',
    maxAge: USER_TOKEN_MAX_AGE_SEC,
  });
  return response;
}

