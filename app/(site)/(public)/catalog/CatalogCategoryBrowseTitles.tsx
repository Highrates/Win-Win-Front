'use client';

import Link from 'next/link';
import { Fragment, useMemo } from 'react';
import {
  CATALOG_ALL_TAB_ID,
  useCatalogBrowse,
} from '@/app/(site)/(public)/catalog/CatalogBrowseContext';
import styles from '@/app/(site)/(public)/categories/CategoryPage.module.css';
import { findCatalogPathToId } from '@/lib/catalog/findCatalogRoot';
import type { CategoryBreadcrumb } from '@/lib/catalog/mapCatalogCategoryPageView';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';

type Props = {
  pageCategoryName: string;
  pageCategorySlug: string;
  pageCategoryId: string;
  /** Крошки до страницы категории включительно (последняя — текущая страница без sub). */
  pageBreadcrumbs: CategoryBreadcrumb[];
  roots: HomeCatalogRoot[];
};

/**
 * H1 остаётся именем страницы (`/catalog/[slug]`);
 * при `?sub=` — подзаголовок + доп. крошки (slug страницы не меняем).
 */
export function CatalogCategoryBrowseTitles({
  pageCategoryName,
  pageCategorySlug,
  pageCategoryId,
  pageBreadcrumbs,
  roots,
}: Props) {
  const { productCategoryId, activeSubcategoryId } = useCatalogBrowse();

  const subPath = useMemo(() => {
    if (productCategoryId === pageCategoryId || activeSubcategoryId === CATALOG_ALL_TAB_ID) {
      return [];
    }
    const full = findCatalogPathToId(roots, productCategoryId);
    const pageIdx = full.findIndex((n) => n.id === pageCategoryId);
    if (pageIdx < 0) return [];
    return full.slice(pageIdx + 1);
  }, [roots, pageCategoryId, productCategoryId, activeSubcategoryId]);

  const breadcrumbs = useMemo((): CategoryBreadcrumb[] => {
    if (!subPath.length) return pageBreadcrumbs;

    const prefix = pageBreadcrumbs.slice(0, -1);
    const pageCrumb: CategoryBreadcrumb = {
      label: pageCategoryName,
      href: `/catalog/${encodeURIComponent(pageCategorySlug)}`,
      current: false,
    };
    const subCrumbs: CategoryBreadcrumb[] = subPath.map((node, i) => {
      const isLast = i === subPath.length - 1;
      return {
        label: node.name,
        href: isLast
          ? ''
          : `/catalog/${encodeURIComponent(pageCategorySlug)}?sub=${encodeURIComponent(node.slug)}`,
        current: isLast,
      };
    });
    return [...prefix, pageCrumb, ...subCrumbs];
  }, [pageBreadcrumbs, pageCategoryName, pageCategorySlug, subPath]);

  const subtitle = subPath.length ? subPath[subPath.length - 1]!.name : null;

  return (
    <>
      <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
        {breadcrumbs.map((item, i) => (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && <span className={styles.breadcrumbsSep}>/</span>}
            {item.current ? (
              <span className={styles.breadcrumbsCurrent}>{item.label}</span>
            ) : (
              <Link href={item.href} className={styles.breadcrumbsLink}>
                {item.label}
              </Link>
            )}
          </Fragment>
        ))}
      </nav>
      <div className={styles.previewPageTitlesInner}>
        <h1 className={styles.previewCurrentName}>{pageCategoryName}</h1>
        {subtitle ? <p className={styles.previewSubName}>{subtitle}</p> : null}
      </div>
    </>
  );
}
