import { proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request) {
  return proxyUserBearerFromRequest(request, 'users/me/designer-invite/claim', 'POST', {
    emptyBody: '{}',
  });
}
