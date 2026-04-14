import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/adminAuth';
import { getServerApiBase } from '@/lib/serverApiBase';

export const runtime = 'nodejs';

function isAllowed(segments: string[]): boolean {
  if (segments.length < 2) return false;
  if (segments[0] === 'catalog' && segments[1] === 'admin') return true;
  if (segments[0] === 'audit' && segments[1] === 'admin') return true;
  if (segments[0] === 'orders' && segments[1] === 'admin') return true;
  if (segments[0] === 'blog' && segments[1] === 'admin') return true;
  if (segments[0] === 'users' && segments[1] === 'admin') return true;
  return false;
}

async function proxy(request: NextRequest, segments: string[], method: string) {
  if (!isAllowed(segments)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const token = cookies().get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const path = segments.join('/');
  const url = new URL(request.url);
  const target = `${getServerApiBase()}/${path}${url.search}`;

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const init: RequestInit = { method, headers, cache: 'no-store' };

  if (!['GET', 'HEAD'].includes(method)) {
    const ct = request.headers.get('content-type') ?? '';
    /**
     * Multipart: парсим FormData и пересобираем на стороне Node fetch.
     * Иначе `arrayBuffer()` у NextRequest часто даёт пустое/битое тело → Nest/Multer: «Файл не передан».
     */
    if (ct.includes('multipart/form-data')) {
      /**
       * Не вызываем `request.formData()` — лимит парсера multipart ~1 МБ → 413.
       * Сырое тело через `arrayBuffer()` (до лимита бэкенда 100 МБ), без стриминга:
       * `fetch(body: ReadableStream, duplex: 'half')` к Nest давал POST→GET после редиректа
       * и ответ Nest «Cannot GET /api/v1/.../upload» (404).
       */
      const buf = await request.arrayBuffer();
      if (buf.byteLength === 0) {
        return NextResponse.json({ message: 'Пустое тело запроса' }, { status: 400 });
      }
      headers['Content-Type'] = ct;
      headers['Content-Length'] = String(buf.byteLength);
      init.body = buf;
    } else {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) {
        if (ct) headers['Content-Type'] = ct;
        init.body = body;
      }
    }
  }

  const res = await fetch(target, init);
  const out = new NextResponse(res.body, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}

type Ctx = { params: { segments: string[] } };

export async function GET(request: NextRequest, { params }: Ctx) {
  return proxy(request, params.segments, 'GET');
}

export async function POST(request: NextRequest, { params }: Ctx) {
  return proxy(request, params.segments, 'POST');
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  return proxy(request, params.segments, 'PATCH');
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  return proxy(request, params.segments, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  return proxy(request, params.segments, 'DELETE');
}
