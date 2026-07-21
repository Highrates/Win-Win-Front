import topFoldStyles from '@/sections/home/HomeTopFold.module.css';
import hubTabStyles from './CatalogHubTabs.module.css';
import styles from './CatalogHubSkeleton.module.css';

export function CatalogHubSkeleton() {
  return (
    <main className={styles.root}>
      <div className={`${topFoldStyles.topFold} ${topFoldStyles.topFoldCompact}`}>
        <div className={`${styles.shimmer} ${styles.hero}`} aria-hidden />
        <section className={`${hubTabStyles.section} ${hubTabStyles.sectionFold}`} aria-hidden>
          <div className="padding-global">
            <div className={hubTabStyles.tabsShell}>
              <div className={styles.tabsBarSkeleton}>
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className={`${styles.shimmer} ${styles.tabPill}`} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      <section className={styles.gridSection} aria-hidden>
        <div className="padding-global">
          <div className={styles.grid}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={`${styles.shimmer} ${styles.gridCard}`} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
