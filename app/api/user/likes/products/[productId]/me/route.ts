import { NextResponse } from 'next/server';
import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!productId) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  return proxyUserBearer({
    request,
    backendPath: `likes/products/${encodeURIComponent(productId)}/me`,
    method: 'GET',
  });
}
