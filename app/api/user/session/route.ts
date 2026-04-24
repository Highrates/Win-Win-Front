import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';
import { userSessionGetJson } from '@/lib/userSessionServer';

export async function GET(request: Request) {
  const result = await userSessionGetJson(request, `${getServerApiBase()}/auth/me`);
  if (!result.authenticated) {
    return NextResponse.json({ authenticated: false, error: result.error });
  }
  return NextResponse.json({ authenticated: true, user: result.user });
}
