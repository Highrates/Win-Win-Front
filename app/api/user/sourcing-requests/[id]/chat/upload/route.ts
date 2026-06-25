import { getServerApiBase } from '@/lib/serverApiBase';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  const path = `sourcing-requests/${params.id}/chat/upload`.replace(/^\//, '');
  const url = `${getServerApiBase()}/${path}`;

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
    console.error('[sourcing chat/upload proxy] fetch failed', url, e);
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }

  const text = await res.text();
  const out = new NextResponse(text, { status: res.status });
  const ct = res.headers.get('content-type');
  if (ct) out.headers.set('content-type', ct);
  return out;
}
