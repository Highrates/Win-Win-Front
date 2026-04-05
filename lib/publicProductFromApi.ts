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

export type PublicProductFromApi = {
  slug: string;
  name: string;
  price: unknown;
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

export function parsePublicProduct(raw: unknown): PublicProductFromApi | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.slug !== 'string' || typeof raw.name !== 'string') return null;
  return {
    slug: raw.slug,
    name: raw.name,
    price: raw.price,
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
  };
}
