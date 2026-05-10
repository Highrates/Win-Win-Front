import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.toString();
  const backendPath = q ? `orders?${q}` : 'orders';
  return proxyUserBearer({ request, backendPath, method: 'GET' });
}
