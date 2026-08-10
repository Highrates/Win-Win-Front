import { proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return Response.json({ message: 'Bad Request' }, { status: 400 });
  }
  return proxyUserBearerFromRequest(
    request,
    `catalog/products/${encodeURIComponent(slug)}/qa/messages`,
    'POST',
  );
}
