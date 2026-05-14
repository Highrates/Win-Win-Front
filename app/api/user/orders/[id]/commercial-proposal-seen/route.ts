import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return proxyUserBearer({
    request,
    backendPath: `orders/${params.id}/commercial-proposal-seen`,
    method: 'PATCH',
  });
}
