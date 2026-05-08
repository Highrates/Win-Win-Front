import type { HomeCatalogRoot } from '@/lib/homeCatalog';

type SlugTreeNode = { slug: string; children?: SlugTreeNode[] };

function subtreeContainsSlug(node: SlugTreeNode, slug: string): boolean {
  if (node.slug === slug) return true;
  for (const ch of node.children ?? []) {
    if (subtreeContainsSlug(ch, slug)) return true;
  }
  return false;
}

/**
 * Корень дерева, в поддереве которого есть категория с данным slug (любая глубина).
 * Полезно при синхронизации UI с деревом из `fetchHomeCatalogRoots`.
 */
export function catalogRootIdForSlug(roots: HomeCatalogRoot[], slug: string): string | undefined {
  for (const r of roots) {
    if (subtreeContainsSlug(r, slug)) return r.id;
  }
  return undefined;
}
