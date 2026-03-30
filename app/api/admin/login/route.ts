import { NextResponse } from 'next/server';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_TOKEN_MAX_AGE_SEC,
  adminCookieSecure,
} from '@/lib/adminAuth';
import { getServerApiBase } from '@/lib/serverApiBase';

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

const MSG_401 =
  'Неверный логин или пароль. Если админа ещё не создавали: в каталоге backend выполните «npx prisma db seed» (логин/пароль — ADMIN_SEED_EMAIL и ADMIN_SEED_PASSWORD в backend/.env), затем повторите вход.';

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

  const url = `${getServerApiBase()}/auth/admin/login`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: emailOrPhone.includes('@') ? emailOrPhone.toLowerCase() : emailOrPhone,
        password,
      }),
    });
  } catch (e) {
    console.error('[api/admin/login] fetch failed', url, e);
    return NextResponse.json(
      {
        error:
          'Нет связи с API. Запустите бэкенд (Nest, обычно порт 3001). В frontend/.env задайте API_URL=http://127.0.0.1:3001/api/v1 или NEXT_PUBLIC_API_URL — тот же хост, с которого Next может достучаться до API.',
      },
      { status: 502 },
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      return NextResponse.json({ error: MSG_401 }, { status: 401 });
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

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_ACCESS_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: adminCookieSecure(request),
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_TOKEN_MAX_AGE_SEC,
  });
  return response;
}
