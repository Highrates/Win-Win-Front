/** Чистые хелперы формы бренд-проекта (без React) — для тестов и BrandProjectsPanel. */

export type BrandCaseFormState = {
  title: string;
  shortDescription: string;
  location: string;
  year: string;
  budgetDigits: string;
  descriptionHtml: string;
  coverUrl: string;
  selectedRooms: string[];
  productIds: string[];
  isPublished: boolean;
};

export function brandCaseFormToBody(
  form: BrandCaseFormState,
  formatBudget: (digits: string) => string,
) {
  const yearNum = form.year.trim() ? parseInt(form.year, 10) : null;
  return {
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim().slice(0, 400) || null,
    location: form.location.trim() || null,
    year: yearNum != null && Number.isFinite(yearNum) ? yearNum : null,
    budget: form.budgetDigits.trim() ? formatBudget(form.budgetDigits) : null,
    descriptionHtml: form.descriptionHtml.trim() || null,
    coverLayout: '9:16' as const,
    coverImageUrls: form.coverUrl.trim() ? [form.coverUrl.trim()] : [],
    roomTypes: form.selectedRooms,
    productIds: form.productIds,
    isPublished: form.isPublished,
  };
}

export function isNearAspect9x16(width: number, height: number, tolerance = 0.08): boolean {
  if (width <= 0 || height <= 0) return false;
  const ratio = width / height;
  const target = 9 / 16;
  return Math.abs(ratio - target) / target <= tolerance;
}

export function projectsFeedFilterKey(p: {
  source: string;
  brandSlug?: string | null;
  productBrandSlug?: string | null;
  productId?: string | null;
  room?: string | null;
  hasProducts?: boolean;
  pageSize: number;
}): string {
  return [
    p.source,
    p.brandSlug ?? '',
    p.productBrandSlug ?? '',
    p.productId ?? '',
    p.room ?? '',
    p.hasProducts ? '1' : '0',
    p.pageSize,
  ].join('\0');
}

/** Пагинация ленты выключена, если оба источника сняты (пустая сетка без fetch). */
export function projectsFeedPaginationEnabled(bothSourcesOff: boolean): boolean {
  return !bothSourcesOff;
}
