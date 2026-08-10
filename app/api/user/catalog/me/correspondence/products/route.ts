import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  return proxyUserBearer(
    { request, backendPath: 'catalog/me/correspondence/products', method: 'GET' },
    false,
  );
}
