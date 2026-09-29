import { proxyUserBearer, proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const backendPath = q ? `cases/me?q=${encodeURIComponent(q)}` : 'cases/me';
  return proxyUserBearer({ request, backendPath, method: 'GET' });
}

export async function POST(request: Request) {
  return proxyUserBearerFromRequest(request, 'cases/me', 'POST');
}
