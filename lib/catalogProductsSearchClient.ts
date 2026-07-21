import type { CatalogProductSearchResponse } from '@/lib/catalogPublic';
import type { CatalogFacetFilters } from '@/lib/catalog/catalogProductFilters';
import { catalogFacetFiltersToPatch } from '@/lib/catalog/catalogProductFilters';

export async function fetchCatalogProductsSearchClient(params: {
  categoryId?: string;
  tag?: string;
  page: number;
  limit: number;
  sort?: string;
  priceFrom?: number;
  priceTo?: number;
  facets?: CatalogFacetFilters;
}): Promise<CatalogProductSearchResponse> {
  const qs = new URLSearchParams({
    page: String(Math.max(1, params.page)),
    limit: String(Math.min(Math.max(1, params.limit), 100)),
  });
  if (params.categoryId?.trim()) {
    qs.set('categoryId', params.categoryId.trim());
  }
  if (params.tag?.trim()) {
    qs.set('tag', params.tag.trim());
  }
  if (params.sort?.trim()) {
    qs.set('sort', params.sort.trim());
  }
  if (params.priceFrom != null && Number.isFinite(params.priceFrom)) {
    qs.set('priceFrom', String(Math.floor(params.priceFrom)));
  }
  if (params.priceTo != null && Number.isFinite(params.priceTo)) {
    qs.set('priceTo', String(Math.floor(params.priceTo)));
  }
  if (params.facets) {
    for (const [key, value] of Object.entries(catalogFacetFiltersToPatch(params.facets))) {
      if (value != null && value !== '') qs.set(key, value);
    }
  }
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

export async function fetchCatalogFilterOptionsClient(params: {
  categoryId?: string;
  tag?: string;
  priceFrom?: number;
  priceTo?: number;
  facets?: CatalogFacetFilters;
}): Promise<import('@/lib/catalog/catalogProductFilters').CatalogFilterOptions> {
  const qs = new URLSearchParams();
  if (params.categoryId?.trim()) qs.set('categoryId', params.categoryId.trim());
  if (params.tag?.trim()) qs.set('tag', params.tag.trim());
  if (params.priceFrom != null && Number.isFinite(params.priceFrom)) {
    qs.set('priceFrom', String(Math.floor(params.priceFrom)));
  }
  if (params.priceTo != null && Number.isFinite(params.priceTo)) {
    qs.set('priceTo', String(Math.floor(params.priceTo)));
  }
  if (params.facets) {
    for (const [key, value] of Object.entries(catalogFacetFiltersToPatch(params.facets))) {
      if (value != null && value !== '') qs.set(key, value);
    }
  }
  const empty = {
    materials: [] as { id: string; name: string }[],
    brands: [] as { id: string; name: string }[],
  };
  try {
    const res = await fetch(`/api/public/catalog/products/filter-options?${qs}`, {
      cache: 'no-store',
    });
    if (!res.ok) return empty;
    const data = (await res.json()) as import('@/lib/catalog/catalogProductFilters').CatalogFilterOptions;
    return {
      materials: Array.isArray(data.materials) ? data.materials : [],
      brands: Array.isArray(data.brands) ? data.brands : [],
    };
  } catch {
    return empty;
  }
}
