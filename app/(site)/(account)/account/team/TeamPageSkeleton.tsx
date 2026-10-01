import styles from './page.module.css';

/** Skeleton для Suspense и первичной загрузки /account/team. */
export function TeamPageSkeleton() {
  const sh = styles.skeletonShimmer;
  return (
    <div className={styles.page} aria-busy="true" aria-label="Загрузка команды">
      <div className={`${styles.skeletonTitle} ${sh}`} />
      <div className={styles.skeletonTopBar}>
        <div className={`${styles.skeletonSearch} ${sh}`} />
        <div className={`${styles.skeletonButton} ${sh}`} />
      </div>
      <div className={`${styles.skeletonSummary} ${sh}`} />
      <div className={`${styles.skeletonTable} ${sh}`} />
      <div className={`${styles.skeletonTable} ${sh}`} />
    </div>
  );
}
