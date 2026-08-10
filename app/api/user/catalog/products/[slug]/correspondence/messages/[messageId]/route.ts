import { proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; messageId: string }> },
) {
  const { slug, messageId } = await params;
  if (!slug?.trim() || !messageId?.trim()) {
    return Response.json({ message: 'Bad Request' }, { status: 400 });
  }
  return proxyUserBearerFromRequest(
    request,
    `catalog/products/${encodeURIComponent(slug)}/correspondence/messages/${encodeURIComponent(messageId)}`,
    'PATCH',
  );
}
