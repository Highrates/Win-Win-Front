import Link from 'next/link';
import { ToursListingClient } from '@/app/(site)/(public)/tours/ToursListingClient';
import { fetchChinaToursLanding, fetchChinaToursList } from '@/lib/chinaTours/publicApi';
import styles from './HomeTours.module.css';

/** Teaser на главной: не весь featured-каталог. */
export const HOME_TOURS_TEASER_LIMIT = 6;

/** Блок туров на главной — `ToursListingClient variant=home`, лимит teaser, «ВСЕ» → `/tours`. */
export async function HomeTours() {
  const [landing, tours] = await Promise.all([fetchChinaToursLanding(), fetchChinaToursList()]);
  const list = (tours ?? []).slice(0, HOME_TOURS_TEASER_LIMIT);
  if (!landing && list.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Туры">
      <div className={`padding-global ${styles.inner}`}>
        <div className={styles.titleRow}>
          <h5 className={styles.title}>Туры</h5>
          <Link href="/tours" className={styles.allLink}>
            ВСЕ
          </Link>
        </div>
      </div>
      <ToursListingClient landing={landing} tours={list} variant="home" />
    </section>
  );
}
