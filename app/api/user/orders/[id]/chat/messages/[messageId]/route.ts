import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; messageId: string } },
) {
  return proxyUserBearer({
    request,
    backendPath: `orders/${params.id}/chat/messages/${params.messageId}`,
    method: 'DELETE',
  });
}
