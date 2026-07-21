import skeletonStyles from './homeSkeleton.module.css';
import styles from './HomeBelowFoldSkeleton.module.css';

const PRODUCT_PLACEHOLDERS = 4;

export function HomeBelowFoldSkeleton() {
  return (
    <div className={styles.root} aria-hidden>
      <section className={styles.bestBrands}>
        <div className={styles.bestBrandsSplit}>
          <div className={styles.bestBrandsInfo}>
            <div className={`${skeletonStyles.shimmer} ${styles.bestBrandsTitle}`} />
            <div className={`${skeletonStyles.shimmer} ${styles.bestBrandsDesc}`} />
          </div>
          <div className={styles.bestBrandsCards}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`${skeletonStyles.shimmer} ${styles.brandCard}`} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.products}>
        <div className="padding-global">
          <div className={`${skeletonStyles.shimmer} ${styles.sectionTitle}`} />
          <div className={styles.productGrid}>
            {Array.from({ length: PRODUCT_PLACEHOLDERS }, (_, i) => (
              <div key={i} className={styles.productCard}>
                <div className={`${skeletonStyles.shimmer} ${styles.productThumb}`} />
                <div className={`${skeletonStyles.shimmer} ${styles.productLine}`} />
                <div className={`${skeletonStyles.shimmer} ${styles.productPrice}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.about}>
        <div className="padding-global">
          <div className={`${skeletonStyles.shimmer} ${styles.aboutLogo}`} />
          <div className={`${skeletonStyles.shimmer} ${styles.aboutTagline}`} />
        </div>
      </section>
    </div>
  );
}
