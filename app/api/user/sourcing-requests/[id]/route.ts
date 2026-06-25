import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return proxyUserBearer({
    request,
    backendPath: `sourcing-requests/${encodeURIComponent(params.id)}`,
    method: 'GET',
  });
}
