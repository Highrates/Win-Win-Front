import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; messageId: string } },
) {
  return proxyUserBearer({
    request,
    backendPath: `sourcing-requests/${params.id}/chat/messages/${params.messageId}`,
    method: 'DELETE',
  });
}
