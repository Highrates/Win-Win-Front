import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return proxyUserBearer({
    request,
    backendPath: `china-tours/${encodeURIComponent(slug)}/my-review`,
    method: 'GET',
  });
}

export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await request.text();
  return proxyUserBearer({
    request,
    backendPath: `china-tours/${encodeURIComponent(slug)}/reviews`,
    method: 'POST',
    body,
  });
}
