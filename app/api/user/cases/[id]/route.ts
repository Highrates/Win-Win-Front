import { NextResponse } from 'next/server';
import { proxyUserBearer, proxyUserBearerFromRequest } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  return proxyUserBearer({ request, backendPath: `cases/me/${encodeURIComponent(id)}`, method: 'GET' });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  return proxyUserBearerFromRequest(request, `cases/me/${encodeURIComponent(id)}`, 'PATCH');
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  return proxyUserBearer({ request, backendPath: `cases/me/${encodeURIComponent(id)}`, method: 'DELETE' });
}

