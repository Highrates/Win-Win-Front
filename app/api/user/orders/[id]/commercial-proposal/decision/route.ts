import { proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return proxyUserBearerFromRequest(
    request,
    `orders/${params.id}/commercial-proposal/decision`,
    'POST',
  );
}
