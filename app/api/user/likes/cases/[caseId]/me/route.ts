import { NextResponse } from 'next/server';
import { proxyUserBearer } from '@/lib/userBackendJsonProxy';

export async function GET(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  if (!caseId) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  return proxyUserBearer({
    request,
    backendPath: `likes/cases/${encodeURIComponent(caseId)}/me`,
    method: 'GET',
  });
}
