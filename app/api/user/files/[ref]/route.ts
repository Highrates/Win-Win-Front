import { NextResponse, type NextRequest } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';

const PASS_HEADERS = [
  'content-type',
  'content-disposition',
  'content-length',
  'cache-control',
  'x-content-type-options',
] as const;

/**
 * Переход по ссылке в окне / вкладке (не fetch и не скачивание по `download`): такому запросу
 * вместо текста 401 нужен экран входа. Без Sec-Fetch-* (старые браузеры) — по Accept.
 */
function isDocumentNavigation(request: NextRequest): boolean {
  const mode = request.headers.get('sec-fetch-mode');
  const dest = request.headers.get('sec-fetch-dest');
  if (mode || dest) return mode === 'navigate' && dest === 'document';
  return (request.headers.get('accept') ?? '').includes('text/html');
}

function authRequired(request: NextRequest): NextResponse {
  if (isDocumentNavigation(request)) {
    const login = request.nextUrl.clone();
    login.pathname = '/login/email';
    login.search = '';
    login.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login, 303);
  }
  return new NextResponse('Войдите в аккаунт, чтобы открыть файл', {
    status: 401,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

/** Персональный файл покупателя: бэкенд проверяет доступ и стримит файл (или 302 на внешнюю ссылку). */
export async function GET(request: NextRequest, { params }: { params: { ref: string } }) {
  const token = getUserAccessTokenFromCookies();
  if (!token) return authRequired(request);

  const url = `${getServerApiBase()}/files/${encodeURIComponent(params.ref)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch (e) {
    console.error('[api/user/files] fetch failed', url, e);
    return new NextResponse('Сервис недоступен', { status: 502 });
  }

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');
    if (location) return NextResponse.redirect(location, 302);
  }

  if (res.status === 401) return authRequired(request);

  if (!res.ok || !res.body) {
    const status = res.status === 404 ? 404 : res.ok ? 502 : res.status;
    return new NextResponse(status === 404 ? 'Файл не найден' : 'Не удалось открыть файл', {
      status,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const headers = new Headers({ 'cache-control': 'private, no-store' });
  const encoded = res.headers.has('content-encoding');
  for (const name of PASS_HEADERS) {
    if (name === 'content-length' && encoded) continue;
    const value = res.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new NextResponse(res.body, { status: 200, headers });
}
