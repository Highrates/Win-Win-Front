import { proxyUserBearer, proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  return proxyUserBearer({ request, backendPath: 'users/me/profile', method: 'GET' }, false);
}

export async function PATCH(request: Request) {
  return proxyUserBearerFromRequest(request, 'users/me/profile', 'PATCH');
}
