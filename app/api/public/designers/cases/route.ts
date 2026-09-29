import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DESIGNER_PUBLIC_REVALIDATE_SECONDS } from '@/lib/designersPublicShared';
import { getServerApiBase } from '@/lib/serverApiBase';

/** Плоский список публичных кейсов партнёров (Nest `GET /designers/cases`). */
export async function GET(req: NextRequest) {
  try {
    const base = getServerApiBase();
    const qs = req.nextUrl.searchParams.toString();
    const res = await fetch(`${base}/designers/cases${qs ? `?${qs}` : ''}`, {
      next: { revalidate: DESIGNER_PUBLIC_REVALIDATE_SECONDS },
    });
    const text = await res.text();
    const out = new NextResponse(text, { status: res.status });
    const ct = res.headers.get('content-type');
    if (ct) out.headers.set('content-type', ct);
    return out;
  } catch {
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }
}
