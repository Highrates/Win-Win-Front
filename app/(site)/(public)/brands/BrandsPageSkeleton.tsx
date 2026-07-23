import pageStyles from './BrandsPage.module.css';
import shimmerStyles from '@/sections/home/homeSkeleton.module.css';
import styles from './BrandsPageSkeleton.module.css';

const CARD_PLACEHOLDERS = 12;

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
              {Array.from({ length: CARD_PLACEHOLDERS }, (_, i) => (
                <div key={i} className={styles.card}>
                  <div className={`${shimmerStyles.shimmer} ${styles.cardImage}`} />
                  <div className={`${shimmerStyles.shimmer} ${styles.cardName}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
