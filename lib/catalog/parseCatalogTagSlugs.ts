/** Парсит `?tag=dom,ofis` → уникальные slug'и зон. */
export function parseCatalogTagSlugs(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
}

export function catalogTagsQuery(slugs: string[]): string | undefined {
  const unique = parseCatalogTagSlugs(slugs.join(','));
  return unique.length ? unique.join(',') : undefined;
}
