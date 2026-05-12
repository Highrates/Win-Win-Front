import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  return proxyUserBearer({
    request,
    backendPath: 'order-chat/me/unread-count',
    method: 'GET',
  });
}
