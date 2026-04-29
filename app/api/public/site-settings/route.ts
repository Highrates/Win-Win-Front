import { NextResponse } from 'next/server';
import { getServerApiBase } from '@/lib/serverApiBase';

const empty = {
  heroImageUrls: [] as string[],
  designerServiceOptions: [] as string[],
  caseRoomTypeOptions: [] as string[],
};

export async function GET() {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/settings/site`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json(empty);
    }
    const j = (await res.json().catch(() => ({}))) as {
      heroImageUrls?: unknown;
      designerServiceOptions?: unknown;
      caseRoomTypeOptions?: unknown;
    };
    const heroImageUrls = Array.isArray(j.heroImageUrls)
      ? j.heroImageUrls.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : [];
    const designerServiceOptions = Array.isArray(j.designerServiceOptions)
      ? j.designerServiceOptions
          .map((x) => (typeof x === 'string' ? x.trim() : ''))
          .filter((x) => x.length > 0)
      : [];
    const caseRoomTypeOptions = Array.isArray(j.caseRoomTypeOptions)
      ? j.caseRoomTypeOptions
          .map((x) => (typeof x === 'string' ? x.trim() : ''))
          .filter((x) => x.length > 0)
      : [];
    return NextResponse.json({ heroImageUrls, designerServiceOptions, caseRoomTypeOptions });
  } catch {
    return NextResponse.json(empty);
  }
}
