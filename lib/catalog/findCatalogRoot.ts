import type { HomeCatalogChild, HomeCatalogRoot } from '@/lib/homeCatalog';

function categoryIdInTree(nodes: HomeCatalogChild[], targetId: string): boolean {
  for (const node of nodes) {
    if (node.id === targetId) return true;
    if (node.children?.length && categoryIdInTree(node.children, targetId)) return true;
  }
  return false;
}

/** Корневая категория каталога, в которую входит `categoryId` (сама корневая или любой потомок). */
export function findCatalogRootForCategoryId(
  roots: HomeCatalogRoot[],
  categoryId: string,
): HomeCatalogRoot | null {
  const id = categoryId.trim();
  if (!id) return null;
  for (const root of roots) {
    if (root.id === id) return root;
    if (categoryIdInTree(root.children ?? [], id)) return root;
  }
  return null;
}

/** Узел дерева (корень или любой потомок) по id. */
export function findCatalogNodeById(
  roots: HomeCatalogRoot[],
  categoryId: string,
): HomeCatalogChild | null {
  const id = categoryId.trim();
  if (!id) return null;

  const walk = (nodes: HomeCatalogChild[]): HomeCatalogChild | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children?.length) {
        const found = walk(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  return walk(roots);
}

/**
 * Путь от корня до узла включительно: [root, …, node].
 * Пустой массив, если id не найден.
 */
export function findCatalogPathToId(
  roots: HomeCatalogRoot[],
  categoryId: string,
): HomeCatalogChild[] {
  const id = categoryId.trim();
  if (!id) return [];

  const walk = (
    nodes: HomeCatalogChild[],
    trail: HomeCatalogChild[],
  ): HomeCatalogChild[] | null => {
    for (const node of nodes) {
      const next = [...trail, node];
      if (node.id === id) return next;
      if (node.children?.length) {
        const found = walk(node.children, next);
        if (found) return found;
      }
    }
    return null;
  };

  return walk(roots, []) ?? [];
}

/** Путь от прямых детей `pageNode` до узла с `slug` (включительно). */
export function findCatalogPathToSlugUnder(
  pageNode: Pick<HomeCatalogChild, 'children'>,
  slug: string,
): HomeCatalogChild[] {
  const target = slug.trim();
  if (!target) return [];

  const walk = (
    nodes: HomeCatalogChild[],
    trail: HomeCatalogChild[],
  ): HomeCatalogChild[] | null => {
    for (const node of nodes) {
      const next = [...trail, node];
      if (node.slug === target) return next;
      if (node.children?.length) {
        const found = walk(node.children, next);
        if (found) return found;
      }
    }
    return null;
  };

  return walk(pageNode.children ?? [], []) ?? [];
}

/** Подкатегория по умолчанию для табов: сначала с детьми, иначе первая. */
export function pickDefaultSubcategoryId(subs: HomeCatalogChild[]): string {
  const withChildren = subs.find((s) => (s.children?.length ?? 0) > 0);
  return (withChildren ?? subs[0])?.id ?? '';
}
