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
