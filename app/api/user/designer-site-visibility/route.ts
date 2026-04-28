import { proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function PATCH(request: Request) {
  return proxyUserBearerFromRequest(request, 'users/me/designer-site-visibility', 'PATCH');
}
