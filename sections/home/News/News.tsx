import Link from 'next/link';
import Image from 'next/image';
import styles from './News.module.css';

const posts = [
  { slug: 'novaya-kollekciya', title: 'Новая коллекция 2025', date: '15 января 2025' },
  { slug: 'trendy-interera', title: 'Тренды интерьера', date: '10 января 2025' },
  { slug: 'sovety-dizajneram', title: 'Советы дизайнерам', date: '5 января 2025' },
];

export function News() {
  return (
    <section className={styles.section}>
      <div className="padding-global">
        <div className={styles.wrapper}>
          <div className={styles.titles}>
            <Image
              src="/images/logo.svg"
              alt="Win-Win"
              width={280}
              height={41}
              className={styles.logo}
            />
            <div className={styles.categoriesWrapper}>
              {['События', 'Бренд', 'Интервью'].map((label) => (
                <Link key={label} href={`/blog?category=${label.toLowerCase()}`} className={styles.categoryItem}>
                  {label}
                </Link>
              ))}
              <Link href="/blog" className={styles.allNewsLink}>
                <span className={styles.allNewsText}>Читать все</span>
                <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.arrow} />
              </Link>
            </div>
          </div>
          <div className={styles.grid}>
            <div className={styles.leftCol}>
              <Link href="/blog/novaya-kollekciya" className={styles.articleBigcard}>
                <div className={styles.articleTitles}>
                  <span className={styles.articleCategory}>События</span>
                  <span className={styles.articleTitle}>Новая коллекция мебели 2025 года уже в каталоге</span>
                  <span className={styles.newsLink}>
                    <span className={styles.newsLinkText}>Читать</span>
                    <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.arrow} />
                  </span>
                </div>
                <img className={styles.articleCover} src="https://placehold.co/340x516" alt="" width={340} height={516} />
              </Link>
            </div>
            <div className={styles.rightCol}>
              {posts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.articleCard}>
                  <div className={styles.articleTitles}>
                    <span className={styles.articleCategory}>События</span>
                    <span className={styles.articleTitle}>{p.title}</span>
                    <span className={styles.newsLink}>
                      <span className={styles.newsLinkText}>Читать</span>
                      <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.arrow} />
                    </span>
                  </div>
                  <img className={styles.articleCardCover} src="https://placehold.co/140x140" alt="" width={140} height={140} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
