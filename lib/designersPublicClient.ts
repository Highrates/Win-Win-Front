import type { DesignersListItem } from '@/app/(site)/(public)/designers/DesignersCardsClient';

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
