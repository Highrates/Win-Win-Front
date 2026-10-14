import styles from '../page.module.css';

export function OrdersFeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.ordersInWorkSkeleton} aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: count }, (_, k) => (
        <div key={k} className={styles.orderWrapperSkeleton}>
          <div className={styles.skeletonInWorkCard}>
            <div className={styles.skeletonInWorkTop}>
              <div className={styles.skeletonInWorkLines}>
                <div
                  className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`}
                  style={{ width: '38%', height: 18 }}
                />
                <div className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`} style={{ width: '52%' }} />
                <div className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`} style={{ width: '72%' }} />
              </div>
              <div className={`${styles.skeletonInWorkLine} ${styles.skeletonShimmer}`} style={{ width: 20, height: 20 }} />
            </div>
            <div className={styles.skeletonInWorkDots}>
              <div className={`${styles.skeletonInWorkDot} ${styles.skeletonShimmer}`} />
              <div className={`${styles.skeletonInWorkDot} ${styles.skeletonShimmer}`} />
            </div>
          </div>
          <div className={styles.skeletonInWorkCta}>
            <div className={`${styles.skeletonInWorkCtaBtn} ${styles.skeletonShimmer}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
