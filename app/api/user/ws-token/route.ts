import { NextResponse } from 'next/server';
import { getUserAccessTokenFromCookies } from '@/lib/userSessionServer';

export async function GET() {
  const token = getUserAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ token });
}
