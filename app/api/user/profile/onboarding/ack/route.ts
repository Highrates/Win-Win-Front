import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function PATCH(request: Request) {
  return proxyUserBearer(
    { request, backendPath: 'users/me/profile/onboarding/ack', method: 'PATCH', body: '{}' },
    false,
  );
}
