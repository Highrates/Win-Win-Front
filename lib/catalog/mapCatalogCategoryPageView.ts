import type { CatalogCategoryBySlugApi, PublicCatalogTag } from '@/lib/catalogPublic';
import { findCatalogPathToId } from '@/lib/catalog/findCatalogRoot';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';

export type CategoryBreadcrumb = {
  label: string;
  href: string;
  current: boolean;
};

/** Лендинг зоны `/catalog?tag=`: Главная → Каталог → зона. */
export function buildZoneBreadcrumbs(tag: PublicCatalogTag): CategoryBreadcrumb[] {
  return [
    { label: 'Главная', href: '/', current: false },
    { label: 'Каталог', href: '/catalog', current: false },
    { label: tag.name, href: '', current: true },
  ];
}

/**
 * Полный путь в крошках: Главная → Каталог → …предки… → текущая.
 * Предки берутся из дерева каталога; fallback — только непосредственный parent из API.
 */
export function buildCategoryBreadcrumbs(
  category: CatalogCategoryBySlugApi,
  activeTag?: PublicCatalogTag | null,
  roots?: HomeCatalogRoot[],
): CategoryBreadcrumb[] {
  const homeCatalog: CategoryBreadcrumb[] = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Каталог', href: '/catalog', current: false },
  ];

  let ancestors: CategoryBreadcrumb[] = [];
  if (roots?.length) {
    const path = findCatalogPathToId(roots, category.id);
    ancestors = path.slice(0, -1).map((node) => ({
      label: node.name,
      href: `/catalog/${encodeURIComponent(node.slug)}`,
      current: false,
    }));
  } else if (category.parent) {
    ancestors = [
      {
        label: category.parent.name,
        href: `/catalog/${encodeURIComponent(category.parent.slug)}`,
        current: false,
      },
    ];
  }

  const prefix = [...homeCatalog, ...ancestors];

  if (activeTag) {
    return [
      ...prefix,
      {
        label: activeTag.name,
        href: `/catalog?tag=${encodeURIComponent(activeTag.slug)}`,
        current: false,
      },
      { label: category.name, href: '', current: true },
    ];
  }

  return [...prefix, { label: category.name, href: '', current: true }];
}
