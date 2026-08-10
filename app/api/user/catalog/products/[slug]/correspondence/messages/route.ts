import { proxyUserBearer, proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return Response.json({ message: 'Bad Request' }, { status: 400 });
  }
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const path = `catalog/products/${encodeURIComponent(slug)}/correspondence/messages${qs ? `?${qs}` : ''}`;
  return proxyUserBearer({ request, backendPath: path, method: 'GET' }, false);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return Response.json({ message: 'Bad Request' }, { status: 400 });
  }
  return proxyUserBearerFromRequest(
    request,
    `catalog/products/${encodeURIComponent(slug)}/correspondence/messages`,
    'POST',
  );
}
