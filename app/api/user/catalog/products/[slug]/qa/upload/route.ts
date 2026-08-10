import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';

/** Отмена pending upload (удаление из S3 + ProductQaPendingUpload). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }

  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.text();
  const url = `${getServerApiBase()}/catalog/products/${encodeURIComponent(slug)}/qa/upload`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
    });
  } catch (e) {
    console.error('[product-qa/upload revoke proxy] fetch failed', url, e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }

  const text = await res.text();
  const out = new NextResponse(text, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}

/** Прокси загрузки вложения Q&A (multipart stream без пересборки FormData). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }

  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.toLowerCase().includes('multipart/form-data')) {
    return NextResponse.json(
      { message: 'Неверный запрос: нужен multipart/form-data с полем file' },
      { status: 400 },
    );
  }

  const url = `${getServerApiBase()}/catalog/products/${encodeURIComponent(slug)}/qa/upload`;

  if (!request.body) {
    return NextResponse.json({ message: 'Пустое тело запроса' }, { status: 400 });
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
      body: request.body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });
  } catch (e) {
    console.error('[product-qa/upload proxy] fetch failed', url, e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }

  const text = await res.text();
  const out = new NextResponse(text, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}
