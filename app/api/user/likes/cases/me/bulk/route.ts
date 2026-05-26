import { proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request) {
  return proxyUserBearerFromRequest(request, 'likes/cases/me/bulk', 'POST', { emptyBody: '{}' });
}
