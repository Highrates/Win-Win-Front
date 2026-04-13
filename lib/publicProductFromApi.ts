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

/** Вариант на витрине (`GET /catalog/products/:slug`). */
export type PublicProductVariantApi = {
  id: string;
  variantSlug?: string | null;
  variantLabel?: string | null;
  sizeOptionId?: string | null;
  price: unknown;
  sku: string | null;
  specsJson: unknown;
  optionAttributes: unknown;
  isDefault: boolean;
  images: PublicProductImageApi[];
};

export type PublicProductSizeOptionApi = {
  id: string;
  name: string;
  sizeSlug: string | null;
  sortOrder: number;
  materials: {
    id: string;
    name: string;
    sortOrder: number;
    colors: { id: string; name: string; imageUrl: string; sortOrder: number }[];
  }[];
};

export type PublicProductFromApi = {
  slug: string;
  name: string;
  /** Задано только при выбранном SKU (`?v` / `?vs`) */
  price: unknown;
  /** Диапазон без выбранного SKU */
  priceMin?: unknown;
  priceMax?: unknown;
  shortDescription: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  deliveryText: string | null;
  technicalSpecs: string | null;
  additionalInfoHtml: string | null;
  specsJson: unknown;
  category: PublicProductCategoryApi | null;
  brand: PublicProductBrandApi | null;
  images: PublicProductImageApi[];
  variants: PublicProductVariantApi[];
  defaultVariantId: string | null;
  sizeOptions?: PublicProductSizeOptionApi[];
  /** Выбранный размер из `?sz=` (без SKU) */
  selectedSizeOptionId?: string | null;
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
      sizeOptionId: typeof x.sizeOptionId === 'string' ? x.sizeOptionId : null,
      price: x.price,
      sku: typeof x.sku === 'string' ? x.sku : null,
      specsJson: x.specsJson,
      optionAttributes: x.optionAttributes,
      isDefault: x.isDefault === true,
      images: parseImages(x.images),
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
  const variants = parseVariants(raw.variants);
  const defaultVariantId =
    typeof raw.defaultVariantId === 'string' && raw.defaultVariantId.trim()
      ? raw.defaultVariantId.trim()
      : null;
  return {
    slug: raw.slug,
    name: raw.name,
    price: raw.price,
    priceMin: raw.priceMin,
    priceMax: raw.priceMax,
    shortDescription: typeof raw.shortDescription === 'string' ? raw.shortDescription : null,
    description: typeof raw.description === 'string' ? raw.description : null,
    seoTitle: typeof raw.seoTitle === 'string' ? raw.seoTitle : null,
    seoDescription: typeof raw.seoDescription === 'string' ? raw.seoDescription : null,
    deliveryText: typeof raw.deliveryText === 'string' ? raw.deliveryText : null,
    technicalSpecs: typeof raw.technicalSpecs === 'string' ? raw.technicalSpecs : null,
    additionalInfoHtml: typeof raw.additionalInfoHtml === 'string' ? raw.additionalInfoHtml : null,
    specsJson: raw.specsJson,
    category: parseCategory(raw.category),
    brand: raw.brand == null ? null : parseBrand(raw.brand),
    images: parseImages(raw.images),
    variants,
    defaultVariantId,
    sizeOptions: parseSizeOptions(raw.sizeOptions),
    selectedSizeOptionId:
      typeof raw.selectedSizeOptionId === 'string' && raw.selectedSizeOptionId.trim()
        ? raw.selectedSizeOptionId.trim()
        : raw.selectedSizeOptionId === null
          ? null
          : undefined,
  };
}

function parseSizeOptions(raw: unknown): PublicProductSizeOptionApi[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: PublicProductSizeOptionApi[] = [];
  for (const x of raw) {
    if (!isRecord(x)) continue;
    if (typeof x.id !== 'string' || typeof x.name !== 'string') continue;
    const materials: PublicProductSizeOptionApi['materials'] = [];
    if (Array.isArray(x.materials)) {
      for (const m of x.materials) {
        if (!isRecord(m) || typeof m.id !== 'string' || typeof m.name !== 'string') continue;
        const colors: PublicProductSizeOptionApi['materials'][0]['colors'] = [];
        if (Array.isArray(m.colors)) {
          for (const c of m.colors) {
            if (!isRecord(c) || typeof c.id !== 'string' || typeof c.name !== 'string') continue;
            const imageUrl = typeof c.imageUrl === 'string' ? c.imageUrl : '';
            colors.push({
              id: c.id,
              name: c.name,
              imageUrl,
              sortOrder: typeof c.sortOrder === 'number' ? c.sortOrder : 0,
            });
          }
        }
        materials.push({
          id: m.id,
          name: m.name,
          sortOrder: typeof m.sortOrder === 'number' ? m.sortOrder : 0,
          colors,
        });
      }
    }
    out.push({
      id: x.id,
      name: x.name,
      sizeSlug: typeof x.sizeSlug === 'string' ? x.sizeSlug : null,
      sortOrder: typeof x.sortOrder === 'number' ? x.sortOrder : 0,
      materials,
    });
  }
  return out.length ? out : undefined;
}
