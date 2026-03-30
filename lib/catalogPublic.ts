import { catalogPublicFetchNext } from './catalogCache';
import { getServerApiBase } from './serverApiBase';

/** `GET /catalog/categories/tree` */
export type PublicCategoryTreeChild = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  backgroundImageUrl: string | null;
};

export type PublicCategoryTreeRoot = PublicCategoryTreeChild & {
  children: PublicCategoryTreeChild[];
};

export type CatalogCategoryBySlugApi = {
  id: string;
  slug: string;
  name: string;
  parentId?: string | null;
  sortOrder: number;
  backgroundImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  parent: { id: string; slug: string; name: string } | null;
  children: Array<{
    id: string;
    slug: string;
    name: string;
    sortOrder: number;
    backgroundImageUrl?: string | null;
  }>;
  _count?: { products: number };
};

export async function fetchCategoryTree(): Promise<{ roots: PublicCategoryTreeRoot[] }> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/catalog/categories/tree`, { next: catalogPublicFetchNext() });
    if (!res.ok) return { roots: [] };
    return res.json();
  } catch {
    return { roots: [] };
  }
}

/** `GET /catalog/categories/roots` — только корни для меню. */
export async function fetchPublicRootCategoriesForNav(): Promise<{ slug: string; name: string }[]> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/catalog/categories/roots`, { next: catalogPublicFetchNext() });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items: { slug: string; name: string; sortOrder: number }[];
    };
    return data.items.map(({ slug, name }) => ({ slug, name }));
  } catch {
    return [];
  }
}

/** `GET /catalog/categories/:parentSlug/children` */
export async function fetchCategoryChildrenByParentSlug(parentSlug: string): Promise<{
  parent: { slug: string; name: string };
  children: PublicCategoryTreeChild[];
} | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(
      `${base}/catalog/categories/${encodeURIComponent(parentSlug)}/children`,
      { next: catalogPublicFetchNext() }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCategoryBySlug(
  slug: string
): Promise<CatalogCategoryBySlugApi | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/catalog/categories/${encodeURIComponent(slug)}`, {
      next: catalogPublicFetchNext(),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as CatalogCategoryBySlugApi | null;
    return data ?? null;
  } catch {
    return null;
  }
}
