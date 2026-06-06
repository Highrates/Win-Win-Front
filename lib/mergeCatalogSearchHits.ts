import type { CatalogProductSearchHit } from '@/lib/catalogPublic';

export function mergeCatalogSearchHits(
  prev: CatalogProductSearchHit[],
  chunk: CatalogProductSearchHit[],
): CatalogProductSearchHit[] {
  if (chunk.length === 0) return prev;
  const seen = new Set(prev.map((h) => h.id));
  const merged = [...prev];
  for (const hit of chunk) {
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    merged.push(hit);
  }
  return merged;
}
