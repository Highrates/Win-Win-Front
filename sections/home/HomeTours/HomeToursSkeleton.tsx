import skeletonStyles from '../homeSkeleton.module.css';
import styles from './HomeToursSkeleton.module.css';

/** Плейсхолдер блока туров на главной (Suspense / below-fold). */
export function HomeToursSkeleton() {
  return (
    <section className={styles.section} aria-hidden>
      <div className={`padding-global ${styles.inner}`}>
        <div className={`${skeletonStyles.shimmer} ${styles.title}`} />
      </div>
      <div className={styles.track}>
        <div className={styles.intro}>
          <div className={`${skeletonStyles.shimmer} ${styles.introLine}`} />
          <div className={`${skeletonStyles.shimmer} ${styles.introLineShort}`} />
          <div className={`${skeletonStyles.shimmer} ${styles.introImage}`} />
          <div className={`${skeletonStyles.shimmer} ${styles.introText}`} />
        </div>
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className={styles.card}>
            <div className={`${skeletonStyles.shimmer} ${styles.cardThumb}`} />
            <div className={`${skeletonStyles.shimmer} ${styles.cardTitle}`} />
            <div className={`${skeletonStyles.shimmer} ${styles.cardLine}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
