import { proxyUserBearer, proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  return proxyUserBearer({ request, backendPath: 'orders/me/preparation', method: 'GET' });
}

export async function PATCH(request: Request) {
  return proxyUserBearerFromRequest(request, 'orders/me/preparation', 'PATCH');
}
