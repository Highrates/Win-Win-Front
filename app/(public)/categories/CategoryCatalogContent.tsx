import Link from 'next/link';
import { Fragment } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCardsStrip, type CategoryCardItem } from './CategoryCardsStrip';
import {
  CATEGORY_PER_PAGE,
  categoryCatalogPageHref,
  getCategoryMarketProducts,
} from './categoryCatalogData';
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
  /** База URL для пагинации: `/categories` или `/categories/<slug>` */
  paginationBasePath: string;
  currentPage: number;
  /** Родительская категория: полоса карточек подкатегорий после превью */
  showSubcategoryCardsStrip?: boolean;
  previewImageSrc?: string;
  subcategoryItems?: CategoryCardItem[];
};

export function CategoryCatalogContent({
  categoryTitle,
  parentCategoryName,
  breadcrumbs,
  paginationBasePath,
  currentPage,
  showSubcategoryCardsStrip = false,
  previewImageSrc = '/images/placeholder.svg',
  subcategoryItems,
}: Props) {
  const allProducts = getCategoryMarketProducts(60);
  const totalPages = Math.ceil(allProducts.length / CATEGORY_PER_PAGE) || 1;
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const start = (page - 1) * CATEGORY_PER_PAGE;
  const marketProducts = allProducts.slice(start, start + CATEGORY_PER_PAGE);

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
            <img
              src={previewImageSrc}
              alt=""
              width={768}
              height={393}
              className={styles.previewImage}
            />
          </div>
        </div>
      </section>

      {showSubcategoryCardsStrip && subcategoryItems && subcategoryItems.length > 0 ? (
        <div className={styles.categoryScrollCatalogSlot} aria-label="Подкатегории">
          <CategoryCardsStrip items={subcategoryItems} />
        </div>
      ) : null}

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
                <span className={styles.marketSectionRowResultValue}>{allProducts.length}</span>
              </div>
            </div>
            <div className={styles.marketGrid}>
              {marketProducts.map((p) => (
                <ProductCard key={p.key} slug={p.slug} name={p.name} price={p.price} />
              ))}
            </div>
            <nav className={styles.paginationWrapper} aria-label="Пагинация">
              {page <= 1 ? (
                <span className={styles.paginationBtnDisabled}>НАЗАД</span>
              ) : (
                <Link
                  href={categoryCatalogPageHref(paginationBasePath, page - 1)}
                  className={styles.paginationBtn}
                >
                  НАЗАД
                </Link>
              )}
              <div className={styles.paginationPages}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
                  n === page ? (
                    <span key={n} className={styles.paginationPageCurrent}>
                      {n}
                    </span>
                  ) : (
                    <Link
                      key={n}
                      href={categoryCatalogPageHref(paginationBasePath, n)}
                      className={styles.paginationPage}
                    >
                      {n}
                    </Link>
                  )
                )}
              </div>
              {page >= totalPages ? (
                <span className={styles.paginationBtnDisabled}>ДАЛЕЕ</span>
              ) : (
                <Link
                  href={categoryCatalogPageHref(paginationBasePath, page + 1)}
                  className={styles.paginationBtn}
                >
                  ДАЛЕЕ
                </Link>
              )}
            </nav>
          </div>
        </div>
      </section>
    </main>
  );
}
