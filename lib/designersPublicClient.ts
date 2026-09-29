import type { DesignersListItem } from '@/app/(site)/(public)/designers/DesignersCardsClient';
import type { ProjectData } from '@/app/(site)/(public)/designers/DesignerProjectsSection';
import {
  DESIGNER_CASES_PAGE_SIZE,
  PUBLIC_CASES_PAGE_SIZE,
  designerProjectsFromPayload,
  parsePublicDesignerPayload,
} from '@/lib/designersPublicShared';
import { mapPublicCaseToProjectData } from '@/lib/mapPublicCaseToProjectData';
import { parseNestPublicCaseItem } from '@/lib/parseNestPublicCase';

export { DESIGNER_CASES_PAGE_SIZE, PUBLIC_CASES_PAGE_SIZE };

export async function fetchDesignersPublicClient(params: {
  page: number;
  limit: number;
  q?: string;
}): Promise<{ items: DesignersListItem[]; total: number }> {
  const qs = new URLSearchParams({
    page: String(Math.max(1, params.page)),
    limit: String(Math.min(Math.max(1, params.limit), 100)),
  });
  const q = params.q?.trim();
  if (q) qs.set('q', q);

  try {
    const res = await fetch(`/api/public/designers?${qs.toString()}`, { cache: 'no-store' });
    if (!res.ok) return { items: [], total: 0 };
    const data = (await res.json()) as { items?: DesignersListItem[]; total?: number };
    return {
      items: data.items ?? [],
      total: typeof data.total === 'number' ? data.total : 0,
    };
  } catch {
    return { items: [], total: 0 };
  }
}

export function mergeDesignersListItems(
  prev: DesignersListItem[],
  chunk: DesignersListItem[],
): DesignersListItem[] {
  if (chunk.length === 0) return prev;
  const seen = new Set(prev.map((item) => item.id || item.slug));
  const merged = [...prev];
  for (const item of chunk) {
    const key = item.id || item.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

export async function fetchDesignerCasesPageClient(
  slug: string,
  page: number,
  limit = DESIGNER_CASES_PAGE_SIZE,
  opts?: { hasProducts?: boolean },
): Promise<{ projects: ProjectData[]; total: number } | null> {
  const qs = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(Math.min(60, Math.max(1, limit))),
  });
  if (opts?.hasProducts) qs.set('hasProducts', '1');
  try {
    const res = await fetch(`/api/public/designers/${encodeURIComponent(slug)}?${qs}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as Record<string, unknown>;
    const parsed = parsePublicDesignerPayload(raw, slug);
    return {
      projects: designerProjectsFromPayload(parsed),
      total: parsed.casesTotal,
    };
  } catch {
    return null;
  }
}

export function mergeProjectDataItems(prev: ProjectData[], chunk: ProjectData[]): ProjectData[] {
  if (chunk.length === 0) return prev;
  const seen = new Set(prev.map((p) => p.id ?? p.title));
  const merged = [...prev];
  for (const item of chunk) {
    const key = item.id ?? item.title;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

export async function fetchPublicCasesPageClient(params: {
  page: number;
  limit?: number;
  productId?: string | null;
}): Promise<{ projects: ProjectData[]; total: number }> {
  const qs = new URLSearchParams({
    page: String(Math.max(1, params.page)),
    limit: String(Math.min(60, Math.max(1, params.limit ?? PUBLIC_CASES_PAGE_SIZE))),
  });
  const product = params.productId?.trim();
  if (product) qs.set('product', product);
  try {
    const res = await fetch(`/api/public/designers/cases?${qs}`, { cache: 'no-store' });
    if (!res.ok) return { projects: [], total: 0 };
    const raw = (await res.json()) as Record<string, unknown>;
    const rawItems = raw.items;
    if (!Array.isArray(rawItems)) return { projects: [], total: 0 };
    const projects: ProjectData[] = [];
    for (const row of rawItems) {
      const parsed = parseNestPublicCaseItem(row, { requireDesignerMeta: true });
      if (!parsed?.designer) continue;
      projects.push(
        mapPublicCaseToProjectData(parsed.case, {
          slug: parsed.designer.slug,
          name: parsed.designer.name,
          photoUrl: parsed.designer.photoUrl,
        }),
      );
    }
    return {
      projects,
      total: typeof raw.total === 'number' ? raw.total : projects.length,
    };
  } catch {
    return { projects: [], total: 0 };
  }
}
