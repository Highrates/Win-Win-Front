import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  return proxyUserBearer({ request, backendPath: 'users/me/winwin-team', method: 'GET' }, false);
}
