import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request) {
  const raw = await request.text();
  const body = raw.trim().length > 0 ? raw : undefined;
  return proxyUserBearer({ request, backendPath: 'orders/me/preparation/submit', method: 'POST', body });
}
