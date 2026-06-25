import { proxyUserBearer, proxyUserBearerFormDataPost } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.toString();
  const backendPath = q ? `sourcing-requests?${q}` : 'sourcing-requests';
  return proxyUserBearer({ request, backendPath, method: 'GET' });
}

export async function POST(request: Request) {
  return proxyUserBearerFormDataPost(request, 'sourcing-requests');
}
