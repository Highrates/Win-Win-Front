import type { CatalogProductSearchResponse } from '@/lib/catalogPublic';

export async function fetchCatalogProductsSearchClient(params: {
  categoryId: string;
  page: number;
  limit: number;
}): Promise<CatalogProductSearchResponse> {
  const qs = new URLSearchParams({
    page: String(Math.max(1, params.page)),
    limit: String(Math.min(Math.max(1, params.limit), 100)),
    categoryId: params.categoryId.trim(),
  });
  try {
    const res = await fetch(`/api/public/catalog/products/search?${qs}`, { cache: 'no-store' });
    if (!res.ok) {
      return { hits: [], total: 0, page: params.page, limit: params.limit };
    }
    return (await res.json()) as CatalogProductSearchResponse;
  } catch {
    return { hits: [], total: 0, page: params.page, limit: params.limit };
  }
}
