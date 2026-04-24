import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  return proxyUserBearer(
    { request, backendPath: 'auth/account/contact/phone/start', method: 'POST', body },
    false,
  );
}
