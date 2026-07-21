import pageStyles from './ProductPageLayout.module.css';
import skeletonStyles from '@/sections/home/homeSkeleton.module.css';
import styles from './ProductPageSkeleton.module.css';
import { ProductSetSiblingsSkeleton } from './ProductSetSiblingsSkeleton';

export function ProductPageSkeleton() {
  return (
    <main aria-busy="true" aria-label="Загрузка страницы товара">
      <section className={pageStyles.productSection}>
        <div className="padding-global">
          <div className={pageStyles.productPageFlow}>
            <div className={`${skeletonStyles.shimmer} ${styles.breadcrumbsRow}`} aria-hidden />

            <div className={`${skeletonStyles.shimmer} ${styles.gallery}`} aria-hidden />

            <div className={styles.detailsGrid} aria-hidden>
              <div className={styles.detailsLeft}>
                <div className={`${skeletonStyles.shimmer} ${styles.brandLine}`} />
                <div className={`${skeletonStyles.shimmer} ${styles.titleLine}`} />
                <div className={styles.interactRow}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className={`${skeletonStyles.shimmer} ${styles.interactPill}`} />
                  ))}
                </div>
              </div>
              <div className={styles.detailsRight}>
                <div className={`${skeletonStyles.shimmer} ${styles.priceLine}`} />
                <div className={styles.actionsRow}>
                  <div className={`${skeletonStyles.shimmer} ${styles.actionSecondary}`} />
                  <div className={`${skeletonStyles.shimmer} ${styles.actionPrimary}`} />
                </div>
                <div className={`${skeletonStyles.shimmer} ${styles.descBlock}`} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <ProductSetSiblingsSkeleton />
    </main>
  );
}
