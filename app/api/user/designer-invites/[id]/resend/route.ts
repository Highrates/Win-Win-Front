import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  const id = encodeURIComponent(context.params.id);
  return proxyUserBearer(
    {
      request,
      backendPath: `users/me/designer-invites/${id}/resend`,
      method: 'POST',
      body: '{}',
    },
    false,
  );
}
