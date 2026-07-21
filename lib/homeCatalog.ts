import { cache } from 'react';
import {
  fetchCategoryTree,
  type PublicCategoryTreeChild,
  type PublicCategoryTreeRoot,
} from './catalogPublic';
import { resolveMediaUrlForClient, resolveMediaUrlForServer } from './publicMediaUrl';

export type HomeCatalogChild = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  cardImageUrl: string;
  productCount?: number;
  children?: HomeCatalogChild[];
};

export type HomeCatalogRoot = HomeCatalogChild & {
  children: HomeCatalogChild[];
};

function mapChild(c: PublicCategoryTreeChild): HomeCatalogChild {
  const nested = c.children?.length ? c.children.map(mapChild) : undefined;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    sortOrder: c.sortOrder,
    cardImageUrl: resolveMediaUrlForServer(c.backgroundImageUrl),
    ...(nested && nested.length > 0 ? { children: nested } : {}),
  };
}

function mapRoot(r: PublicCategoryTreeRoot): HomeCatalogRoot {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    sortOrder: r.sortOrder,
    cardImageUrl: resolveMediaUrlForServer(r.backgroundImageUrl),
    productCount: typeof r.productCount === 'number' ? r.productCount : 0,
    children: (r.children ?? []).map(mapChild),
  };
}

function mapChildClient(c: PublicCategoryTreeChild): HomeCatalogChild {
  const nested = c.children?.length ? c.children.map(mapChildClient) : undefined;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    sortOrder: c.sortOrder,
    cardImageUrl: resolveMediaUrlForClient(c.backgroundImageUrl),
    ...(nested && nested.length > 0 ? { children: nested } : {}),
  };
}

function mapRootClient(r: PublicCategoryTreeRoot): HomeCatalogRoot {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    sortOrder: r.sortOrder,
    cardImageUrl: resolveMediaUrlForClient(r.backgroundImageUrl),
    productCount: typeof r.productCount === 'number' ? r.productCount : 0,
    children: (r.children ?? []).map(mapChildClient),
  };
}

/** Ответ `GET /catalog/categories/tree` → данные для ScrollCatalog в браузере. */
export function homeRootsFromPublicTreeClient(data: { roots: PublicCategoryTreeRoot[] }): HomeCatalogRoot[] {
  return data.roots.map(mapRootClient);
}

async function fetchHomeCatalogRootsUncached(): Promise<HomeCatalogRoot[]> {
  const { roots } = await fetchCategoryTree();
  return roots.map(mapRoot);
}

/** Дедуп fetch дерева каталога в рамках одного RSC-запроса. */
export const loadHomeCatalogRoots = cache(fetchHomeCatalogRootsUncached);

/** Корневые категории с дочерними для блока каталога на главной. */
export async function fetchHomeCatalogRoots(): Promise<HomeCatalogRoot[]> {
  return loadHomeCatalogRoots();
}
