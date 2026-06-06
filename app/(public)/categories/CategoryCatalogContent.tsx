import Link from 'next/link';
import Image from 'next/image';
import { Fragment, type ReactNode } from 'react';
import {
  CatalogSubcategoryCardsStrip,
  type CatalogSubcategoryCardItem,
} from '@/app/(public)/catalog/CatalogSubcategoryCardsStrip';
import { CategoryCatalogGridClient } from '@/app/(public)/categories/CategoryCatalogGridClient';
import type { CatalogProductSearchHit } from '@/lib/catalogPublic';
import styles from './CategoryPage.module.css';

export type CategoryBreadcrumb = {
  label: string;
  href: string;
  current: boolean;
};

type Props = {
  /** Заголовок H1 (текущая категория / подкатегория) */
  categoryTitle: string;
  /** Строка над H1 (родитель); на странице «Гостиная» — null */
  parentCategoryName: string | null;
  breadcrumbs: CategoryBreadcrumb[];
  categoryId: string;
  catalogHits: CatalogProductSearchHit[];
  catalogTotal: number;
  previewImageSrc?: string;
  /** Только `/catalog`: табы разделов + полоса карточек после превью */
  belowPreview?: ReactNode;
  /** `/catalog`: табы + сетка с клиентской подгрузкой по категории */
  catalogIndexBody?: ReactNode;
  /** `/catalog/[slug]`: корневая категория — полоса прямых подкатегорий */
  showSubcategoryCardsStrip?: boolean;
  subcategoryItems?: CatalogSubcategoryCardItem[];
};

export function CategoryCatalogContent({
  categoryTitle,
  parentCategoryName,
  breadcrumbs,
  categoryId,
  catalogHits,
  catalogTotal,
  previewImageSrc = '/images/placeholder.svg',
  belowPreview,
  catalogIndexBody,
  showSubcategoryCardsStrip = false,
  subcategoryItems,
}: Props) {
  return (
    <main>
      <section className={styles.previewPageSection}>
        <div className="padding-global">
          <div className={styles.previewPageWrapper}>
            <div className={styles.previewPageTitles}>
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
                {parentCategoryName != null && (
                  <span className={styles.previewParentName}>{parentCategoryName}</span>
                )}
                <h1 className={styles.previewCurrentName}>{categoryTitle}</h1>
              </div>
            </div>
            {previewImageSrc.startsWith('/') ? (
              <Image
                src={previewImageSrc}
                alt=""
                width={768}
                height={393}
                className={styles.previewImage}
                sizes="(max-width: 768px) 100vw, min(768px, 55vw)"
                priority
                unoptimized
              />
            ) : (
              <img
                src={previewImageSrc}
                alt=""
                width={768}
                height={393}
                className={styles.previewImage}
              />
            )}
          </div>
        </div>
      </section>

      {catalogIndexBody ? null : belowPreview}

      {showSubcategoryCardsStrip && subcategoryItems && subcategoryItems.length > 0 ? (
        <div className={styles.categoryScrollCatalogSlot} aria-label="Подкатегории">
          <CatalogSubcategoryCardsStrip items={subcategoryItems} />
        </div>
      ) : null}

      {catalogIndexBody}

      {catalogIndexBody ? null : (
      <section className={styles.marketSection} aria-label="Каталог товаров">
        <div className="padding-global">
          <div className={styles.marketSectionInner}>
            <div className={styles.marketSectionRow}>
              <div className={styles.marketSectionRowLeft}>
                <div className={styles.marketFilterGroup}>
                  <button type="button" aria-label="Фильтр">
                    <img src="/icons/filter.svg" alt="" width={20} height={20} />
                    <span>Фильтр</span>
                  </button>
                </div>
                <div className={styles.marketSortGroup}>
                  <button type="button" aria-label="Сортировка">
                    <img src="/icons/sort.svg" alt="" width={20} height={20} />
                    <span>Самые популярные</span>
                  </button>
                </div>
              </div>
              <div className={styles.marketSectionRowResult}>
                <span className={styles.marketSectionRowResultLabel}>Результат: </span>
                <span className={styles.marketSectionRowResultValue}>{catalogTotal}</span>
              </div>
            </div>
            <CategoryCatalogGridClient
              categoryId={categoryId}
              initialHits={catalogHits}
              initialTotal={catalogTotal}
            />
          </div>
        </div>
      </section>
      )}
    </main>
  );
}
