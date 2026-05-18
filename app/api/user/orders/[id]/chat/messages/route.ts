import { proxyUserBearer, proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const u = new URL(request.url);
  const qs = u.searchParams.toString();
  const suffix = qs ? `?${qs}` : '';
  return proxyUserBearer({
    request,
    backendPath: `orders/${params.id}/chat/messages${suffix}`,
    method: 'GET',
  });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return proxyUserBearerFromRequest(request, `orders/${params.id}/chat/messages`, 'POST');
}
