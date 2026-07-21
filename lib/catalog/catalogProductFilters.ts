/** Парсинг / сериализация query-фильтров каталога (клиент + SSR). */

export type CatalogFacetFilters = {
  brandIds: string[];
  materialIds: string[];
  /** Ширина варианта, мм (`ProductVariant.widthMm`). */
  widthFrom?: number;
  widthTo?: number;
  /** Высота варианта, мм (`ProductVariant.heightMm`). */
  heightFrom?: number;
  heightTo?: number;
  hasCase: boolean;
  has3d: boolean;
  hasDrawing: boolean;
};

export const EMPTY_CATALOG_FACET_FILTERS: CatalogFacetFilters = {
  brandIds: [],
  materialIds: [],
  hasCase: false,
  has3d: false,
  hasDrawing: false,
};

export function parseCsvIds(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

export function parseFlagParam(raw: string | null | undefined): boolean {
  if (raw == null) return false;
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function parseCatalogSizeBound(raw?: string | null): number | undefined {
  if (raw == null || String(raw).trim() === '') return undefined;
  const n = Number(String(raw).trim().replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

export function normalizeCatalogSizeRange(
  from?: number,
  to?: number,
): { from?: number; to?: number } {
  let a = from;
  let b = to;
  if (a != null && b != null && a > b) {
    const tmp = a;
    a = b;
    b = tmp;
  }
  return { from: a, to: b };
}

export function formatCatalogDimChip(
  axis: 'width' | 'height',
  bound: 'from' | 'to',
  value: number,
): string {
  const digits = Math.floor(value).toLocaleString('ru-RU');
  const axisLabel = axis === 'width' ? 'ширина' : 'высота';
  return bound === 'from' ? `${axisLabel} от ${digits} мм` : `${axisLabel} до ${digits} мм`;
}

export function parseCatalogFacetFiltersFromSearchParams(
  sp: URLSearchParams | {
    get(name: string): string | null;
  },
): CatalogFacetFilters {
  const width = normalizeCatalogSizeRange(
    parseCatalogSizeBound(sp.get('widthFrom')),
    parseCatalogSizeBound(sp.get('widthTo')),
  );
  const height = normalizeCatalogSizeRange(
    parseCatalogSizeBound(sp.get('heightFrom')),
    parseCatalogSizeBound(sp.get('heightTo')),
  );
  return {
    brandIds: parseCsvIds(sp.get('brandId')),
    materialIds: parseCsvIds(sp.get('materialId')),
    widthFrom: width.from,
    widthTo: width.to,
    heightFrom: height.from,
    heightTo: height.to,
    hasCase: parseFlagParam(sp.get('hasCase')),
    has3d: parseFlagParam(sp.get('has3d')),
    hasDrawing: parseFlagParam(sp.get('hasDrawing')),
  };
}

export function catalogFacetFiltersToPatch(
  filters: CatalogFacetFilters,
): Record<string, string | null> {
  return {
    brandId: filters.brandIds.length ? filters.brandIds.join(',') : null,
    materialId: filters.materialIds.length ? filters.materialIds.join(',') : null,
    widthFrom: filters.widthFrom != null ? String(filters.widthFrom) : null,
    widthTo: filters.widthTo != null ? String(filters.widthTo) : null,
    heightFrom: filters.heightFrom != null ? String(filters.heightFrom) : null,
    heightTo: filters.heightTo != null ? String(filters.heightTo) : null,
    sizeFrom: null,
    sizeTo: null,
    size: null,
    hasCase: filters.hasCase ? '1' : null,
    has3d: filters.has3d ? '1' : null,
    hasDrawing: filters.hasDrawing ? '1' : null,
  };
}

export function catalogFacetFiltersKey(filters: CatalogFacetFilters): string {
  return [
    filters.brandIds.slice().sort().join(','),
    filters.materialIds.slice().sort().join(','),
    filters.widthFrom ?? '',
    filters.widthTo ?? '',
    filters.heightFrom ?? '',
    filters.heightTo ?? '',
    filters.hasCase ? '1' : '0',
    filters.has3d ? '1' : '0',
    filters.hasDrawing ? '1' : '0',
  ].join(';');
}

export function hasActiveCatalogFacetFilters(filters: CatalogFacetFilters): boolean {
  return (
    filters.brandIds.length > 0 ||
    filters.materialIds.length > 0 ||
    filters.widthFrom != null ||
    filters.widthTo != null ||
    filters.heightFrom != null ||
    filters.heightTo != null ||
    filters.hasCase ||
    filters.has3d ||
    filters.hasDrawing
  );
}

export type CatalogFilterOptions = {
  materials: { id: string; name: string }[];
  brands: { id: string; name: string }[];
};

export const EMPTY_CATALOG_FILTER_OPTIONS: CatalogFilterOptions = {
  materials: [],
  brands: [],
};
