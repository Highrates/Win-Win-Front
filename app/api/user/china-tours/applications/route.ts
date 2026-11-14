import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  return proxyUserBearer({
    request,
    backendPath: 'china-tours/my-applications',
    method: 'GET',
  });
}
