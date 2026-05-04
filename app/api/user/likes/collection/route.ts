import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const backendPath = search ? `likes/collection${search}` : 'likes/collection';
  return proxyUserBearer({ request, backendPath, method: 'GET' });
}
