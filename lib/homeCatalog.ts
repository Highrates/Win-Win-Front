import { fetchCategoryTree, type PublicCategoryTreeRoot } from './catalogPublic';
import { resolveMediaUrlForClient, resolveMediaUrlForServer } from './publicMediaUrl';

export type HomeCatalogChild = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  cardImageUrl: string;
};

export type HomeCatalogRoot = HomeCatalogChild & {
  children: HomeCatalogChild[];
};

function mapChild(c: PublicCategoryTreeRoot['children'][number]): HomeCatalogChild {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    sortOrder: c.sortOrder,
    cardImageUrl: resolveMediaUrlForServer(c.backgroundImageUrl),
  };
}

function mapRoot(r: PublicCategoryTreeRoot): HomeCatalogRoot {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    sortOrder: r.sortOrder,
    cardImageUrl: resolveMediaUrlForServer(r.backgroundImageUrl),
    children: r.children.map(mapChild),
  };
}

function mapChildClient(c: PublicCategoryTreeRoot['children'][number]): HomeCatalogChild {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    sortOrder: c.sortOrder,
    cardImageUrl: resolveMediaUrlForClient(c.backgroundImageUrl),
  };
}

function mapRootClient(r: PublicCategoryTreeRoot): HomeCatalogRoot {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    sortOrder: r.sortOrder,
    cardImageUrl: resolveMediaUrlForClient(r.backgroundImageUrl),
    children: r.children.map(mapChildClient),
  };
}

/** Ответ `GET /catalog/categories/tree` → данные для ScrollCatalog в браузере. */
export function homeRootsFromPublicTreeClient(data: { roots: PublicCategoryTreeRoot[] }): HomeCatalogRoot[] {
  return data.roots.map(mapRootClient);
}

/** Корневые категории с дочерними для блока каталога на главной. */
export async function fetchHomeCatalogRoots(): Promise<HomeCatalogRoot[]> {
  const { roots } = await fetchCategoryTree();
  return roots.map(mapRoot);
}
