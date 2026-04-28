import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { setUserAccessTokenCookie } from '@/lib/userAuth';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';

function nextResponseFromUpstream(res: Response, bodyText: string): NextResponse {
  const out = new NextResponse(bodyText, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}

type ProxyJsonBase = {
  request: Request;
  /** путь относительно API base, напр. `users/me/profile` */
  backendPath: string;
  method: 'GET' | 'POST' | 'PATCH';
  body?: string;
};

/**
 * Прокси JSON (GET/PATCH/POST) к Nest с Authorization: текущий JWT.
 * Пробрасывает тело и content-type ответа как есть.
 * `setCookieFromAccessToken` — снять `access_token` из JSON и записать в httpOnly cookie (только POST-флоу авторизации).
 */
export async function proxyUserBearer(
  { request, backendPath, method, body }: ProxyJsonBase,
  setCookieFromAccessToken: boolean = false,
): Promise<NextResponse> {
  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const path = backendPath.replace(/^\//, '');
  const url = `${getServerApiBase()}/${path}`;
  let res: Response;
  try {
    const hasBody = typeof body === 'string' && body.length > 0;
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(hasBody ? { body } : {}),
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[proxyUserBearer] fetch failed', url, e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }

  const text = await res.text();

  if (!setCookieFromAccessToken) {
    return nextResponseFromUpstream(res, text);
  }

  if (!res.ok) {
    return nextResponseFromUpstream(res, text);
  }

  let parsed: { access_token?: string; user?: unknown };
  try {
    parsed = JSON.parse(text) as { access_token?: string; user?: unknown };
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 502 });
  }

  if (!parsed.access_token || typeof parsed.access_token !== 'string') {
    return NextResponse.json({ message: 'No access_token in response' }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true, user: parsed.user ?? null });
  setUserAccessTokenCookie(response, request, parsed.access_token);
  return response;
}

/**
 * Прокси multipart/raw body (например загрузка файла в ЛК профиля).
 */
export async function proxyUserBearerPostMultipart(request: Request, backendPath: string): Promise<NextResponse> {
  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const path = backendPath.replace(/^\//, '');
  const url = `${getServerApiBase()}/${path}`;
  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  let body: ArrayBuffer;
  try {
    body = await request.arrayBuffer();
  } catch {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': contentType,
      },
      body,
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[proxyUserBearerPostMultipart] fetch failed', url, e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }

  const text = await res.text();
  return nextResponseFromUpstream(res, text);
}

/** Multipart/form-data POST (partner application и т.п.) — без ручного Content-Type (boundary задаёт клиент/fetch). */
export async function proxyUserBearerFormDataPost(request: Request, backendPath: string): Promise<NextResponse> {
  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const path = backendPath.replace(/^\//, '');
  const url = `${getServerApiBase()}/${path}`;
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[proxyUserBearerFormDataPost] fetch failed', url, e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }
  const text = await res.text();
  return nextResponseFromUpstream(res, text);
}

/**
 * PATCH/POST: прочитать тело из входящего запроса и проксировать на Nest с Bearer.
 * Единый JSON 400 при ошибке чтения тела и тот же апстрим-ответ, что у `proxyUserBearer`.
 */
export async function proxyUserBearerFromRequest(
  request: Request,
  backendPath: string,
  method: 'PATCH' | 'POST',
  opts?: {
    setCookieFromAccessToken?: boolean;
    /** Если после trim тело пустое — подставить (напр. "{}" для invite/claim). */
    emptyBody?: string;
  },
): Promise<NextResponse> {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }
  const trimmed = body.trim();
  const normalized =
    trimmed === '' && opts?.emptyBody !== undefined ? opts.emptyBody : body;
  return proxyUserBearer(
    { request, backendPath, method, body: normalized },
    opts?.setCookieFromAccessToken ?? false,
  );
}
