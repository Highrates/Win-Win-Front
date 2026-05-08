import styles from './CatalogPageSkeleton.module.css';
import catStyles from '@/app/(public)/categories/CategoryPage.module.css';

const PRODUCT_GRID_PLACEHOLDERS = 12;

export function CatalogPageSkeleton() {
  return (
    <main className={styles.root}>
      <section className={catStyles.previewPageSection}>
        <div className="padding-global">
          <div className={catStyles.previewPageWrapper}>
            <div className={catStyles.previewPageTitles}>
              <div className={`${styles.shimmer} ${styles.breadcrumbsRow}`} aria-hidden />
              <div className={catStyles.previewPageTitlesInner}>
                <div className={`${styles.shimmer} ${styles.parentLine}`} aria-hidden />
                <div className={`${styles.shimmer} ${styles.titleLine}`} aria-hidden />
              </div>
            </div>
            <div className={`${styles.shimmer} ${styles.heroImg}`} aria-hidden />
          </div>
        </div>
      </section>

      <section className={styles.tabsStripSection} aria-hidden>
        <div className="padding-global">
          <div className={styles.tabsBarSkeleton}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`${styles.shimmer} ${styles.tabPill}`} />
            ))}
          </div>
          <div className={styles.stripRow}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`${styles.shimmer} ${styles.stripCard}`} />
            ))}
          </div>
        </div>
      </section>

      <section className={catStyles.marketSection}>
        <div className="padding-global">
          <div className={catStyles.marketSectionInner}>
            <div className={styles.marketToolbar}>
              <div className={`${styles.shimmer} ${styles.toolbarBtn}`} />
              <div className={`${styles.shimmer} ${styles.toolbarBtnWide}`} />
              <div className={`${styles.shimmer} ${styles.toolbarCount}`} />
            </div>
            <div className={catStyles.marketGrid}>
              {Array.from({ length: PRODUCT_GRID_PLACEHOLDERS }, (_, i) => (
                <div key={i} className={styles.productSkeleton}>
                  <div className={`${styles.shimmer} ${styles.productThumb}`} />
                  <div className={`${styles.shimmer} ${styles.productTitle}`} />
                  <div className={`${styles.shimmer} ${styles.productPrice}`} />
                </div>
              ))}
            </div>
            <div className={styles.paginationSkeleton}>
              <div className={`${styles.shimmer} ${styles.pageBtn}`} />
              <div className={styles.pageNums}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className={`${styles.shimmer} ${styles.pageDot}`} />
                ))}
              </div>
              <div className={`${styles.shimmer} ${styles.pageBtn}`} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
