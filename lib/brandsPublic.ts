import { catalogPublicFetchNext } from './catalogCache';
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
  likedByMe?: boolean;
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

export async function fetchPublicBrands(options?: {
  categoryId?: string | null;
}): Promise<PublicBrandListRow[]> {
  const base = getServerApiBase();
  const categoryId = options?.categoryId?.trim();
  const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  try {
    const res = await fetch(`${base}/brands${qs}`, { next: catalogPublicFetchNext() });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as PublicBrandListRow[]) : [];
  } catch {
    return [];
  }
}

/** Страница бренда в браузере (вкладки категорий на `/brands/[slug]`). */
export async function fetchPublicBrandBySlugClient(
  slug: string,
  categoryId?: string | null,
): Promise<PublicBrandDetailPayload | null> {
  const id = categoryId?.trim();
  const qs = id ? `?categoryId=${encodeURIComponent(id)}` : '';
  try {
    const res = await fetch(`/api/brands/${encodeURIComponent(slug)}${qs}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as PublicBrandDetailPayload | null;
    return data?.slug ? data : null;
  } catch {
    return null;
  }
}

/** Список брендов в браузере (вкладки категорий на `/brands`). */
export async function fetchPublicBrandsClient(categoryId?: string | null): Promise<PublicBrandListRow[]> {
  const id = categoryId?.trim();
  const qs = id ? `?categoryId=${encodeURIComponent(id)}` : '';
  try {
    const res = await fetch(`/api/brands${qs}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as PublicBrandListRow[]) : [];
  } catch {
    return [];
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

export { productPriceToNumber } from './productPrice';

export function plainTextExcerptFromHtml(html: string | null | undefined, maxLen = 280): string {
  if (!html?.trim()) return '';
  const t = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}
