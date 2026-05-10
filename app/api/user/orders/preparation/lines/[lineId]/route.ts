import { proxyUserBearer, proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

type Ctx = { params: Promise<{ lineId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { lineId } = await ctx.params;
  return proxyUserBearerFromRequest(request, `orders/me/preparation/lines/${encodeURIComponent(lineId)}`, 'PATCH');
}

export async function DELETE(request: Request, ctx: Ctx) {
  const { lineId } = await ctx.params;
  return proxyUserBearer({
    request,
    backendPath: `orders/me/preparation/lines/${encodeURIComponent(lineId)}`,
    method: 'DELETE',
  });
}
