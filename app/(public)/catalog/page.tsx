import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchHomeCatalogRoots } from '@/lib/homeCatalog';
import styles from './CatalogHub.module.css';

export const metadata: Metadata = {
  title: 'Каталог — Win-Win',
  description: 'Каталог мебели и предметов интерьера',
};

export default async function CatalogIndexPage() {
  const roots = await fetchHomeCatalogRoots();

  if (roots.length === 0) {
    return (
      <main className={`padding-global ${styles.page}`}>
        <p>Каталог пока пуст.</p>
        <p className={styles.emptyBack}>
          <Link href="/">На главную</Link>
        </p>
      </main>
    );
  }

  return (
    <main className={`padding-global ${styles.page}`}>
      <nav className={styles.breadcrumbs} aria-label="Навигация">
        <Link href="/" className={styles.breadcrumbsLink}>
          Главная
        </Link>
        <span className={styles.breadcrumbsSep} aria-hidden>
          /
        </span>
        <span className={styles.breadcrumbsCurrent}>Каталог</span>
      </nav>

      <h1 className={styles.title}>Каталог</h1>
      <p className={styles.lead}>Выберите раздел</p>

      <ul className={styles.grid}>
        {roots.map((root) => (
          <li key={root.id} className={styles.gridItem}>
            <Link href={`/catalog/${root.slug}`} className={styles.card}>
              <div className={styles.cardImgWrap}>
                <img
                  src={root.cardImageUrl}
                  alt=""
                  width={320}
                  height={240}
                  className={styles.cardImg}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <span className={styles.cardTitle}>{root.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
