import topFoldStyles from './HomeTopFold.module.css';
import skeletonStyles from './homeSkeleton.module.css';
import { HomeBelowFoldSkeleton } from './HomeBelowFoldSkeleton';
import styles from './HomePageSkeleton.module.css';

export function HomePageSkeleton() {
  return (
    <main className={styles.root} aria-busy="true" aria-label="Загрузка главной страницы">
      <div className={topFoldStyles.topFold}>
        <div className={`${skeletonStyles.shimmer} ${styles.hero}`} />
        <section className={styles.catalog}>
          <div className={`padding-global ${styles.catalogInner}`}>
            <div className={styles.tabsRow}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`${skeletonStyles.shimmer} ${styles.tab}`} />
              ))}
            </div>
            <div className={styles.stripRow}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={`${skeletonStyles.shimmer} ${styles.stripCard}`} />
              ))}
            </div>
          </div>
        </section>
      </div>
      <HomeBelowFoldSkeleton />
    </main>
  );
}
