import { NextResponse } from 'next/server';
import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function POST(request: Request, { params }: { params: Promise<{ designerId: string }> }) {
  const { designerId } = await params;
  if (!designerId) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  return proxyUserBearer({
    request,
    backendPath: `likes/designers/${encodeURIComponent(designerId)}`,
    method: 'POST',
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ designerId: string }> }) {
  const { designerId } = await params;
  if (!designerId) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  return proxyUserBearer({
    request,
    backendPath: `likes/designers/${encodeURIComponent(designerId)}`,
    method: 'DELETE',
  });
}

