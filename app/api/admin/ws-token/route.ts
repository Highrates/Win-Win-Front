import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/adminAuth';
import { orderChatWsMetaFromAccessTokenJwt } from '@/lib/orderChat/parseJwtPayloadUnverified';

export async function GET() {
  const token = cookies().get(ADMIN_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { sub, exp } = orderChatWsMetaFromAccessTokenJwt(token);
  return NextResponse.json({ token, sub, exp });
}
