import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/adminAuth';

export async function GET() {
  const token = cookies().get(ADMIN_ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ token });
}
