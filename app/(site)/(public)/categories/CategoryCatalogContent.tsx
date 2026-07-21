import Link from 'next/link';
import Image from 'next/image';
import { Fragment, type ReactNode } from 'react';
import type { CategoryBreadcrumb } from '@/lib/catalog/mapCatalogCategoryPageView';
import styles from './CategoryPage.module.css';

export type { CategoryBreadcrumb } from '@/lib/catalog/mapCatalogCategoryPageView';

type Props = {
  /** Заголовок H1 (текущая категория / подкатегория) */
  categoryTitle: string;
  /** Строка над H1 (родитель); на странице «Гостиная» — null */
  parentCategoryName: string | null;
  breadcrumbs: CategoryBreadcrumb[];
  /** Если задан — вместо стандартных крошек + H1 (клиентский browse с `?sub=`). */
  heroTitles?: ReactNode;
  previewImageSrc?: string;
  /** Только `/catalog`: табы разделов + полоса карточек после превью */
  belowPreview?: ReactNode;
  /** Сетка товаров; на лендинге зоны не передаётся. */
  productGrid?: ReactNode;
  /** Компактный отступ market-секции (каталог `/catalog/[slug]`). */
  marketCompact?: boolean;
  /** aria-label секции с товарами; по умолчанию «Каталог товаров». */
  marketSectionLabel?: string;
};

export function CategoryCatalogContent({
  categoryTitle,
  parentCategoryName,
  breadcrumbs,
  heroTitles,
  previewImageSrc = '/images/placeholder.svg',
  belowPreview,
  productGrid,
  marketCompact = false,
  marketSectionLabel = 'Каталог товаров',
}: Props) {
  return (
    <main>
      <section className={styles.previewPageSection}>
        <div className="padding-global">
          <div className={styles.previewPageWrapper}>
            <div className={styles.previewPageTitles}>
              {heroTitles ?? (
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
                    {parentCategoryName != null && (
                      <span className={styles.previewParentName}>{parentCategoryName}</span>
                    )}
                    <h1 className={styles.previewCurrentName}>{categoryTitle}</h1>
                  </div>
                </>
              )}
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

      {belowPreview}

      {productGrid != null ? (
        <section
          className={
            marketCompact ? `${styles.marketSection} ${styles.marketSectionCompact}` : styles.marketSection
          }
          aria-label={marketSectionLabel}
        >
          <div className="padding-global">
            <div className={styles.marketSectionInner}>{productGrid}</div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
