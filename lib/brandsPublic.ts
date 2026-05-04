import { catalogPublicFetchNext } from './catalogCache';
import { dedupeById } from './dedupeById';
import { getServerApiBase } from './serverApiBase';

/** Ответ `GET /brands` (элемент списка). */
export type PublicBrandListRow = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  backgroundImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
};

export type PublicBrandProductRow = {
  id: string;
  slug: string;
  name: string;
  /** Подпись варианта для витрины; если нет — совпадает с `name`. */
  displayName?: string;
  /** Вариант по умолчанию (или первый активный) для ссылки `?v=`. */
  variantId?: string | null;
  price: unknown;
  currency: string;
  images: { url: string; sortOrder: number }[];
  casesLinkedCount?: number;
  likesDisplayCount?: number;
};

export type PublicBrandDetailPayload = PublicBrandListRow & {
  seoTitle: string | null;
  seoDescription: string | null;
  galleryImageUrls: unknown;
  products: PublicBrandProductRow[];
};

/** Обложка на витрине: как в админке — приоритет backgroundImageUrl. */
export function brandCoverImageUrl(
  b: Pick<PublicBrandListRow, 'backgroundImageUrl' | 'coverImageUrl' | 'logoUrl'>,
): string | null {
  const u = (b.backgroundImageUrl || b.coverImageUrl || b.logoUrl || '').trim();
  return u || null;
}

export async function fetchPublicBrands(): Promise<PublicBrandListRow[]> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/brands`, { next: catalogPublicFetchNext() });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as PublicBrandListRow[]) : [];
  } catch {
    return [];
  }
}

export async function fetchPublicBrandBySlug(slug: string): Promise<PublicBrandDetailPayload | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/brands/${encodeURIComponent(slug)}`, {
      next: catalogPublicFetchNext(),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as PublicBrandDetailPayload | null;
    if (!data?.slug) return null;
    if (data.products?.length) {
      return { ...data, products: dedupeById(data.products) };
    }
    return data;
  } catch {
    return null;
  }
}

/** Первые N брендов в порядке sortOrder (супер-меню). */
export function publicBrandsMenuSlice(
  brands: PublicBrandListRow[],
  limit = 10,
): { slug: string; name: string }[] {
  return [...brands]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, limit)
    .map(({ slug, name }) => ({ slug, name }));
}

/** До `limit` брендов с непустой обложкой, в порядке sortOrder. */
export function featuredBrandsWithCover(
  brands: PublicBrandListRow[],
  limit = 8,
): PublicBrandListRow[] {
  const ordered = [...brands].sort((a, b) => a.sortOrder - b.sortOrder);
  return ordered.filter((b) => brandCoverImageUrl(b)).slice(0, limit);
}

export function brandsSortedAlphabetically(brands: PublicBrandListRow[]): PublicBrandListRow[] {
  return [...brands].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export function productPriceToNumber(price: unknown): number {
  if (typeof price === 'number' && !Number.isNaN(price)) return price;
  if (typeof price === 'string') {
    const n = parseFloat(price);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

export function plainTextExcerptFromHtml(html: string | null | undefined, maxLen = 280): string {
  if (!html?.trim()) return '';
  const t = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}
