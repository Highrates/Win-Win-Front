import type { HomeCatalogChild, HomeCatalogRoot } from '@/lib/homeCatalog';

export type ScrollCatalogStripItem = {
  key: string;
  href: string;
  name: string;
  imageSrc: string;
};

export const HOME_SCROLL_CATALOG_TAB_PREFIX = 'home-scroll-catalog';
export const HOME_SCROLL_CATALOG_PANEL_ID = `${HOME_SCROLL_CATALOG_TAB_PREFIX}-cards-panel`;

export function homeScrollCatalogTabId(slug: string): string {
  return `${HOME_SCROLL_CATALOG_TAB_PREFIX}-tab-${slug}`;
}

export function stripItemsForRoot(root: HomeCatalogRoot | undefined): ScrollCatalogStripItem[] {
  if (!root) return [];
  const children = root.children ?? [];
  if (children.length > 0) {
    return stripItemsForChildren(children);
  }
  return [
    {
      key: root.slug,
      href: `/catalog/${root.slug}`,
      name: root.name,
      imageSrc: root.cardImageUrl,
    },
  ];
}

/** Карточки полосы из списка дочерних категорий. */
export function stripItemsForChildren(
  children: HomeCatalogChild[] | undefined,
): ScrollCatalogStripItem[] {
  if (!children?.length) return [];
  return children.map((c) => ({
    key: c.slug,
    href: `/catalog/${c.slug}`,
    name: c.name,
    imageSrc: c.cardImageUrl,
  }));
}
