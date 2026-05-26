import 'server-only';

import type { PublicBrandDetailPayload } from '@/lib/brandsPublic';
import { dedupeById } from '@/lib/dedupeById';
import { getServerApiBase } from '@/lib/serverApiBase';
import { publicFetchInitWithOptionalUserAuth } from '@/lib/server/publicFetchInit';

export async function fetchPublicBrandBySlug(slug: string): Promise<PublicBrandDetailPayload | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(
      `${base}/brands/${encodeURIComponent(slug)}`,
      await publicFetchInitWithOptionalUserAuth(),
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as PublicBrandDetailPayload | null;
    if (!data?.slug) return null;
    if (data.products?.length) {
      return { ...data, products: dedupeById(data.products) };
    }
    return data;
  } catch {
    return null;
  }
}
