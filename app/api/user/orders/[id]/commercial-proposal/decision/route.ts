import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return proxyUserBearer({
    request,
    backendPath: `orders/${params.id}/commercial-proposal/decision`,
    method: 'POST',
  });
}
