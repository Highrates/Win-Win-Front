import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function PATCH(request: Request) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  return proxyUserBearer(
    { request, backendPath: 'users/me/consents', method: 'PATCH', body },
    false,
  );
}
