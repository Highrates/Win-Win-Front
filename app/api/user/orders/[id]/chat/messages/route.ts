import { proxyUserBearer, proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return proxyUserBearer({
    request,
    backendPath: `orders/${params.id}/chat/messages`,
    method: 'GET',
  });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return proxyUserBearerFromRequest(request, `orders/${params.id}/chat/messages`, 'POST');
}
