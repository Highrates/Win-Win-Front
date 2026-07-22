import pageStyles from './BrandsPage.module.css';
import shimmerStyles from '@/sections/home/homeSkeleton.module.css';
import styles from './BrandsPageSkeleton.module.css';

const FEATURED_PLACEHOLDERS = 8;
const LETTER_BLOCKS = 2;
const LINKS_PER_COLUMN = 5;

export function BrandsPageSkeleton() {
  return (
    <main className={styles.root} aria-busy aria-label="Загрузка брендов">
      <section className={pageStyles.mainSection} aria-hidden>
        <div className="padding-global">
          <div className={pageStyles.mainSectionInner}>
            <div className={`${shimmerStyles.shimmer} ${styles.breadcrumbs}`} />
            <div className={pageStyles.searchBox}>
              <div className={`${shimmerStyles.shimmer} ${styles.searchBar}`} />
            </div>
            <div className={pageStyles.brandCardsWrapper}>
              {Array.from({ length: FEATURED_PLACEHOLDERS }, (_, i) => (
                <div key={i} className={styles.card}>
                  <div className={`${shimmerStyles.shimmer} ${styles.cardImage}`} />
                  <div className={`${shimmerStyles.shimmer} ${styles.cardName}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={pageStyles.allBrandsSection} aria-hidden>
        <div className="padding-global">
          <div className={pageStyles.allBrandsWrapper}>
            {Array.from({ length: LETTER_BLOCKS }, (_, bi) => (
              <div key={bi} className={pageStyles.allBrandsLetterBlock}>
                <div className={`${shimmerStyles.shimmer} ${styles.letter}`} />
                <div className={pageStyles.allBrandsGrid}>
                  {Array.from({ length: 4 }, (_, ci) => (
                    <div key={ci} className={pageStyles.allBrandsColumn}>
                      {Array.from({ length: LINKS_PER_COLUMN }, (_, li) => (
                        <div
                          key={li}
                          className={`${shimmerStyles.shimmer} ${styles.linkLine}`}
                          style={{ width: `${55 + ((li + ci) % 4) * 10}%` }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
