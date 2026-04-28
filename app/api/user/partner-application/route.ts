import { proxyUserBearerFormDataPost } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request) {
  return proxyUserBearerFormDataPost(request, 'users/me/partner-application');
}
