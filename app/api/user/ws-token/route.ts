import { NextResponse } from 'next/server';
import { orderChatWsMetaFromAccessTokenJwt } from '@/lib/orderChat/parseJwtPayloadUnverified';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';

export async function GET() {
  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { sub, exp } = orderChatWsMetaFromAccessTokenJwt(token);
  return NextResponse.json({ token, sub, exp });
}
