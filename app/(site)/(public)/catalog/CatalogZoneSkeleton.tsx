import styles from './CatalogZoneSkeleton.module.css';
import catStyles from '@/app/(site)/(public)/categories/CategoryPage.module.css';

export function CatalogZoneSkeleton() {
  return (
    <main className={styles.root}>
      <section className={catStyles.previewPageSection}>
        <div className="padding-global">
          <div className={catStyles.previewPageWrapper}>
            <div className={catStyles.previewPageTitles}>
              <div className={`${styles.shimmer} ${styles.breadcrumbsRow}`} aria-hidden />
              <div className={catStyles.previewPageTitlesInner}>
                <div className={`${styles.shimmer} ${styles.titleLine}`} aria-hidden />
              </div>
            </div>
            <div className={`${styles.shimmer} ${styles.heroImg}`} aria-hidden />
          </div>
        </div>
      </section>

      <section className={styles.gridSection} aria-hidden>
        <div className="padding-global">
          <div className={styles.introLine} />
          <div className={styles.grid}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`${styles.shimmer} ${styles.gridCard}`} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
