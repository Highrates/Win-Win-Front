import { proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request) {
  return proxyUserBearerFromRequest(request, 'auth/account/contact/phone/verify', 'POST', {
    setCookieFromAccessToken: true,
  });
}
