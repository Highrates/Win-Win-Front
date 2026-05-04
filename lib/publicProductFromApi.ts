/** Ответ `GET /catalog/products/:slug` (Prisma → JSON). */

export type PublicProductCategoryApi = {
  id: string;
  slug: string;
  name: string;
  parent: { id: string; slug: string; name: string } | null;
};

export type PublicProductBrandApi = {
  slug: string;
  name: string;
  shortDescription: string | null;
  logoUrl: string | null;
};

export type PublicProductImageApi = {
  url: string;
  alt?: string | null;
};

/** Выбор «материал-цвет» для элемента в рамках варианта. */
export type PublicVariantSelectionApi = {
  productElementId: string;
  brandMaterialColorId: string;
};

/** Вариант на витрине (`GET /catalog/products/:slug`). */
export type PublicProductVariantApi = {
  id: string;
  variantSlug?: string | null;
  variantLabel?: string | null;
  modificationId: string | null;
  price: unknown;
  sku: string | null;
  isDefault: boolean;
  images: PublicProductImageApi[];
  selections: PublicVariantSelectionApi[];
};

/** Модификация товара (размер/конфигурация). */
export type PublicProductModificationApi = {
  id: string;
  name: string;
  modificationSlug: string | null;
  sortOrder: number;
};

/** Доступный «материал-цвет» (из брендовой библиотеки) для элемента. */
export type PublicElementAvailabilityApi = {
  brandMaterialColorId: string;
  brandMaterialId: string;
  materialName: string;
  materialSortOrder: number;
  colorName: string;
  imageUrl: string | null;
  sortOrder: number;
};

/** Элемент товара (обивка/ножки/…). */
export type PublicProductElementApi = {
  id: string;
  name: string;
  sortOrder: number;
  availabilities: PublicElementAvailabilityApi[];
};

export type PublicProductFromApi = {
  id: string;
  slug: string;
  name: string;
  /** Задано только при выбранном SKU (`?v` / `?vs`) */
  price: unknown;
  /** Диапазон активных вариантов (всегда отдаём для подписи) */
  priceMin?: unknown;
  priceMax?: unknown;
  /** Сколько кейсов партнёров ссылается на товар (страница «Проекты»). */
  casesLinkedCount: number;
  shortDescription: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  deliveryText: string | null;
  technicalSpecs: string | null;
  additionalInfoHtml: string | null;
  category: PublicProductCategoryApi | null;
  brand: PublicProductBrandApi | null;
  images: PublicProductImageApi[];
  modifications: PublicProductModificationApi[];
  elements: PublicProductElementApi[];
  variants: PublicProductVariantApi[];
  defaultVariantId: string | null;
  defaultModificationId: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function parseCategory(raw: unknown): PublicProductCategoryApi | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.slug !== 'string' || typeof raw.name !== 'string') return null;
  const id = typeof raw.id === 'string' ? raw.id : '';
  let parent: PublicProductCategoryApi['parent'] = null;
  if (raw.parent != null && isRecord(raw.parent)) {
    const p = raw.parent;
    if (typeof p.slug === 'string' && typeof p.name === 'string' && typeof p.id === 'string') {
      parent = { id: p.id, slug: p.slug, name: p.name };
    }
  }
  return { id, slug: raw.slug, name: raw.name, parent };
}

function parseBrand(raw: unknown): PublicProductBrandApi | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.slug !== 'string' || typeof raw.name !== 'string') return null;
  return {
    slug: raw.slug,
    name: raw.name,
    shortDescription: typeof raw.shortDescription === 'string' ? raw.shortDescription : null,
    logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl : null,
  };
}

function parseImages(raw: unknown): PublicProductImageApi[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicProductImageApi[] = [];
  for (const x of raw) {
    if (isRecord(x) && typeof x.url === 'string' && x.url.trim()) {
      out.push({ url: x.url.trim(), alt: typeof x.alt === 'string' ? x.alt : null });
    }
  }
  return out;
}

function parseSelections(raw: unknown): PublicVariantSelectionApi[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicVariantSelectionApi[] = [];
  for (const x of raw) {
    if (!isRecord(x)) continue;
    if (typeof x.productElementId !== 'string' || typeof x.brandMaterialColorId !== 'string') {
      continue;
    }
    out.push({
      productElementId: x.productElementId,
      brandMaterialColorId: x.brandMaterialColorId,
    });
  }
  return out;
}

function parseVariants(raw: unknown): PublicProductVariantApi[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicProductVariantApi[] = [];
  for (const x of raw) {
    if (!isRecord(x)) continue;
    if (typeof x.id !== 'string' || !x.id.trim()) continue;
    out.push({
      id: x.id.trim(),
      variantSlug: typeof x.variantSlug === 'string' ? x.variantSlug : null,
      variantLabel: typeof x.variantLabel === 'string' ? x.variantLabel : null,
      modificationId: typeof x.modificationId === 'string' ? x.modificationId : null,
      price: x.price,
      sku: typeof x.sku === 'string' ? x.sku : null,
      isDefault: x.isDefault === true,
      images: parseImages(x.images),
      selections: parseSelections(x.selections),
    });
  }
  return out;
}

function parseModifications(raw: unknown): PublicProductModificationApi[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicProductModificationApi[] = [];
  for (const x of raw) {
    if (!isRecord(x)) continue;
    if (typeof x.id !== 'string' || typeof x.name !== 'string') continue;
    out.push({
      id: x.id,
      name: x.name,
      modificationSlug: typeof x.modificationSlug === 'string' ? x.modificationSlug : null,
      sortOrder: typeof x.sortOrder === 'number' ? x.sortOrder : 0,
    });
  }
  return out;
}

function parseElementAvailabilities(raw: unknown): PublicElementAvailabilityApi[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicElementAvailabilityApi[] = [];
  for (const x of raw) {
    if (!isRecord(x)) continue;
    const bmcId = typeof x.brandMaterialColorId === 'string' ? x.brandMaterialColorId : '';
    const materialId = typeof x.brandMaterialId === 'string' ? x.brandMaterialId : '';
    const materialName = typeof x.materialName === 'string' ? x.materialName : '';
    const colorName = typeof x.colorName === 'string' ? x.colorName : '';
    if (!bmcId || !materialId) continue;
    out.push({
      brandMaterialColorId: bmcId,
      brandMaterialId: materialId,
      materialName,
      materialSortOrder: typeof x.materialSortOrder === 'number' ? x.materialSortOrder : 0,
      colorName,
      imageUrl: typeof x.imageUrl === 'string' && x.imageUrl.trim() ? x.imageUrl : null,
      sortOrder: typeof x.sortOrder === 'number' ? x.sortOrder : 0,
    });
  }
  return out;
}

function parseElements(raw: unknown): PublicProductElementApi[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicProductElementApi[] = [];
  for (const x of raw) {
    if (!isRecord(x)) continue;
    if (typeof x.id !== 'string' || typeof x.name !== 'string') continue;
    out.push({
      id: x.id,
      name: x.name,
      sortOrder: typeof x.sortOrder === 'number' ? x.sortOrder : 0,
      availabilities: parseElementAvailabilities(x.availabilities),
    });
  }
  return out;
}

/** Выбор варианта по `?vs=` (slug), затем `?v=` (id). Без `?v`/`?vs` — SKU не выбран. */
export function pickPublicProductVariant(
  product: PublicProductFromApi,
  variantIdFromQuery: string | undefined,
  variantSlugFromQuery?: string | undefined,
): { variant: PublicProductVariantApi | null; resolvedVariantId: string | null } {
  const variants = product.variants;
  if (!variants.length) {
    return { variant: null, resolvedVariantId: null };
  }
  const vs = variantSlugFromQuery?.trim();
  if (vs) {
    const bySlug = variants.find((x) => x.variantSlug === vs);
    if (bySlug) {
      return { variant: bySlug, resolvedVariantId: bySlug.id };
    }
  }
  const q = variantIdFromQuery?.trim();
  if (q && variants.some((x) => x.id === q)) {
    const variant = variants.find((x) => x.id === q)!;
    return { variant, resolvedVariantId: variant.id };
  }
  return { variant: null, resolvedVariantId: null };
}

export function parsePublicProduct(raw: unknown): PublicProductFromApi | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.slug !== 'string' || typeof raw.name !== 'string') return null;
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : '';
  if (!id) return null;
  const casesLinkedCountRaw = raw.casesLinkedCount;
  const casesLinkedCount =
    typeof casesLinkedCountRaw === 'number' && Number.isFinite(casesLinkedCountRaw)
      ? Math.max(0, Math.floor(casesLinkedCountRaw))
      : 0;
  const variants = parseVariants(raw.variants);
  const defaultVariantId =
    typeof raw.defaultVariantId === 'string' && raw.defaultVariantId.trim()
      ? raw.defaultVariantId.trim()
      : null;
  const defaultModificationId =
    typeof raw.defaultModificationId === 'string' && raw.defaultModificationId.trim()
      ? raw.defaultModificationId.trim()
      : null;
  return {
    id,
    slug: raw.slug,
    name: raw.name,
    price: raw.price,
    priceMin: raw.priceMin,
    priceMax: raw.priceMax,
    casesLinkedCount,
    shortDescription: typeof raw.shortDescription === 'string' ? raw.shortDescription : null,
    description: typeof raw.description === 'string' ? raw.description : null,
    seoTitle: typeof raw.seoTitle === 'string' ? raw.seoTitle : null,
    seoDescription: typeof raw.seoDescription === 'string' ? raw.seoDescription : null,
    deliveryText: typeof raw.deliveryText === 'string' ? raw.deliveryText : null,
    technicalSpecs: typeof raw.technicalSpecs === 'string' ? raw.technicalSpecs : null,
    additionalInfoHtml: typeof raw.additionalInfoHtml === 'string' ? raw.additionalInfoHtml : null,
    category: parseCategory(raw.category),
    brand: raw.brand == null ? null : parseBrand(raw.brand),
    images: parseImages(raw.images),
    modifications: parseModifications(raw.modifications),
    elements: parseElements(raw.elements),
    variants,
    defaultVariantId,
    defaultModificationId,
  };
}
