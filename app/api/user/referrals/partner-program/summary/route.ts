import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  return proxyUserBearer({ request, backendPath: 'referrals/partner-program/summary', method: 'GET' }, false);
}
