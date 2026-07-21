import styles from './CatalogPageSkeleton.module.css';
import catStyles from '@/app/(site)/(public)/categories/CategoryPage.module.css';

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
          <div className={styles.nestedTabsBarSkeleton}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`${styles.shimmer} ${styles.nestedTabPill}`} />
            ))}
          </div>
        </div>
      </section>

      <section className={catStyles.marketSection}>
        <div className="padding-global">
          <div className={catStyles.marketSectionInner}>
            <div className={`${styles.shimmer} ${styles.toolbarCount}`} aria-hidden />
            <div className={catStyles.marketGrid}>
              {Array.from({ length: PRODUCT_GRID_PLACEHOLDERS }, (_, i) => (
                <div key={i} className={styles.productSkeleton}>
                  <div className={`${styles.shimmer} ${styles.productThumb}`} />
                  <div className={`${styles.shimmer} ${styles.productTitle}`} />
                  <div className={`${styles.shimmer} ${styles.productPrice}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
