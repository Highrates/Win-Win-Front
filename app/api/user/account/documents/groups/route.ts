import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

const FORWARDED_PARAMS = ['limit', 'items', 'cursor', 'filter', 'q'] as const;

export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const q = new URLSearchParams();
  for (const name of FORWARDED_PARAMS) {
    const value = incoming.get(name);
    if (value) q.set(name, value);
  }
  const qs = q.toString();
  return proxyUserBearer({
    request,
    backendPath: `account/documents/groups${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
}
