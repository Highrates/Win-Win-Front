import type { ProjectData } from '@/app/(site)/(public)/designers/designerProjectsTypes';
import { mapPublicCaseToProjectData } from '@/lib/mapPublicCaseToProjectData';
import { parseNestPublicCaseItem } from '@/lib/parseNestPublicCase';
import { DESIGNER_PUBLIC_REVALIDATE_SECONDS, PUBLIC_CASES_PAGE_SIZE } from '@/lib/designersPublicShared';
import { getServerApiBase } from '@/lib/serverApiBase';

export type ProjectsFeedSource = 'all' | 'designers' | 'brands';

export type PublicProjectsListingQuery = {
  brandSlug?: string | null;
  productBrandSlug?: string | null;
  productId?: string | null;
  source?: ProjectsFeedSource;
  room?: string | null;
  hasProducts?: boolean;
  page?: number;
  limit?: number;
};

export type PublicProjectsListingResult = {
  ok: boolean;
  projects: ProjectData[];
  total: number;
  rooms: string[];
  status?: number;
};

export function resolveProjectsFeedSource(q: PublicProjectsListingQuery): ProjectsFeedSource {
  if (q.brandSlug?.trim()) return 'brands';
  if (q.productBrandSlug?.trim()) return 'designers';
  if (q.source === 'designers' || q.source === 'brands' || q.source === 'all') return q.source;
  return 'all';
}

export function parseProjectsFeedPayload(raw: unknown): {
  projects: ProjectData[];
  total: number;
  rooms: string[];
} {
  if (!raw || typeof raw !== 'object') return { projects: [], total: 0, rooms: [] };
  const data = raw as Record<string, unknown>;
  const rawItems = data.items;
  if (!Array.isArray(rawItems)) return { projects: [], total: 0, rooms: [] };
  const projects: ProjectData[] = [];
  for (const row of rawItems) {
    const parsed = parseNestPublicCaseItem(row);
    if (!parsed) continue;
    if (!parsed.designer && !parsed.brand) continue;
    projects.push(
      mapPublicCaseToProjectData(parsed.case, {
        designer: parsed.designer
          ? {
              slug: parsed.designer.slug,
              name: parsed.designer.name,
              photoUrl: parsed.designer.photoUrl,
            }
          : undefined,
        brand: parsed.brand
          ? {
              slug: parsed.brand.slug,
              name: parsed.brand.name,
              logoUrl: parsed.brand.logoUrl,
            }
          : undefined,
      }),
    );
  }
  const rooms = Array.isArray(data.rooms)
    ? data.rooms.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];
  return {
    projects,
    total: typeof data.total === 'number' ? data.total : projects.length,
    rooms,
  };
}

/** SSR / server fetch единой ленты `GET /projects/cases`. */
export async function fetchPublicProjectsListing(
  q: PublicProjectsListingQuery = {},
): Promise<PublicProjectsListingResult> {
  const base = getServerApiBase();
  const page = q.page && q.page > 0 ? Math.floor(q.page) : 1;
  const limit = Math.min(60, Math.max(1, q.limit ?? PUBLIC_CASES_PAGE_SIZE));
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    source: resolveProjectsFeedSource(q),
  });
  if (q.brandSlug?.trim()) qs.set('brand', q.brandSlug.trim());
  if (q.productBrandSlug?.trim()) qs.set('productBrand', q.productBrandSlug.trim());
  if (q.productId?.trim()) qs.set('product', q.productId.trim());
  if (q.room?.trim()) qs.set('room', q.room.trim());
  if (q.hasProducts) qs.set('hasProducts', '1');

  try {
    const res = await fetch(`${base}/projects/cases?${qs}`, {
      next: { revalidate: DESIGNER_PUBLIC_REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return { ok: false, projects: [], total: 0, rooms: [], status: res.status };
    }
    const parsed = parseProjectsFeedPayload(await res.json());
    return { ok: true, ...parsed };
  } catch {
    return { ok: false, projects: [], total: 0, rooms: [] };
  }
}

export async function fetchProductTitleForFilter(productId: string): Promise<string | null> {
  const id = productId.trim();
  if (!id) return null;
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/catalog/products/resolve-ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: Array<{ id: string; name: string }> };
    const item = data.items?.find((i) => i.id === id);
    const name = item?.name?.trim();
    return name && name.length > 0 ? name : null;
  } catch {
    return null;
  }
}
