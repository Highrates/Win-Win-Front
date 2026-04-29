import { proxyUserBearer, proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  return proxyUserBearer({ request, backendPath: 'cases/me', method: 'GET' });
}

export async function POST(request: Request) {
  return proxyUserBearerFromRequest(request, 'cases/me', 'POST');
}

