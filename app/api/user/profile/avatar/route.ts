import { proxyUserBearerPostMultipart } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request) {
  return proxyUserBearerPostMultipart(request, 'users/me/profile/avatar');
}
