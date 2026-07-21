import newsStyles from './News.module.css';
import skeletonStyles from '../homeSkeleton.module.css';
import styles from './NewsSkeleton.module.css';

const ARTICLE_PLACEHOLDERS = 3;

export function NewsSkeleton() {
  return (
    <section className={newsStyles.section} aria-hidden>
      <div className={newsStyles.split}>
        <div className={newsStyles.shell}>
          <div className={`padding-global ${newsStyles.inner}`}>
            <div className={newsStyles.titles}>
              <div className={`${skeletonStyles.shimmer} ${styles.logo}`} />
              <div className={styles.categoriesRow}>
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className={`${skeletonStyles.shimmer} ${styles.categoryPill}`} />
                ))}
              </div>
            </div>

            <div className={newsStyles.grid}>
              <div className={newsStyles.leftCol}>
                <div className={styles.sourcingBlock}>
                  <div className={`${skeletonStyles.shimmer} ${styles.sourcingLine}`} />
                  <div className={`${skeletonStyles.shimmer} ${styles.sourcingTitle}`} />
                  <div className={`${skeletonStyles.shimmer} ${styles.sourcingDesc}`} />
                  <div className={`${skeletonStyles.shimmer} ${styles.sourcingBtn}`} />
                  <div className={`${skeletonStyles.shimmer} ${styles.sourcingVisual}`} />
                </div>
              </div>

              <div className={newsStyles.rightCol}>
                {Array.from({ length: ARTICLE_PLACEHOLDERS }, (_, i) => (
                  <div key={i} className={styles.articleRow}>
                    <div className={styles.articleCopy}>
                      <div className={`${skeletonStyles.shimmer} ${styles.articleCategory}`} />
                      <div className={`${skeletonStyles.shimmer} ${styles.articleTitle}`} />
                    </div>
                    <div className={`${skeletonStyles.shimmer} ${styles.articleCover}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
