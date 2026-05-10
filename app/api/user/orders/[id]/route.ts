import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return proxyUserBearer({
    request,
    backendPath: `orders/${params.id}`,
    method: 'GET',
  });
}
