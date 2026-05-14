import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  const u = new URL(request.url);
  const qs = u.search;
  return proxyUserBearer({
    request,
    backendPath: `order-chat/me/unread-count${qs}`,
    method: 'GET',
  });
}
