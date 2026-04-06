import Link from 'next/link';
import Image from 'next/image';
import { fetchBlogCategoriesPublic, fetchBlogPostsPublic } from '@/lib/blogPublicServer';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import styles from './News.module.css';

export async function News() {
  const [categories, postsRes] = await Promise.all([
    fetchBlogCategoriesPublic(),
    fetchBlogPostsPublic({ limit: 4, page: 1 }),
  ]);
  const posts = postsRes.items;
  if (posts.length === 0) return null;

  const [featured, ...rest] = posts;
  const side = rest.slice(0, 3);

  const featuredCover = resolveMediaUrlForServer(featured.coverUrl);
  const featuredCategory = featured.category?.name ?? '';

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
              {categories.map((c) => (
                <Link key={c.id} href={`/blog?category=${encodeURIComponent(c.slug)}`} className={styles.categoryItem}>
                  {c.name}
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
              <Link href={`/blog/${encodeURIComponent(featured.slug)}`} className={styles.articleBigcard}>
                <div className={styles.articleTitles}>
                  {featuredCategory ? <span className={styles.articleCategory}>{featuredCategory}</span> : null}
                  <span className={styles.articleTitle}>{featured.title}</span>
                  <span className={styles.newsLink}>
                    <span className={styles.newsLinkText}>Читать</span>
                    <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.arrow} />
                  </span>
                </div>
                <img
                  className={styles.articleCover}
                  src={featuredCover}
                  alt=""
                  width={340}
                  height={516}
                />
              </Link>
            </div>
            <div className={styles.rightCol}>
              {side.map((p) => {
                const cover = resolveMediaUrlForServer(p.coverUrl);
                const cat = p.category?.name ?? '';
                return (
                  <Link key={p.id} href={`/blog/${encodeURIComponent(p.slug)}`} className={styles.articleCard}>
                    <div className={styles.articleTitles}>
                      {cat ? <span className={styles.articleCategory}>{cat}</span> : null}
                      <span className={styles.articleTitle}>{p.title}</span>
                      <span className={styles.newsLink}>
                        <span className={styles.newsLinkText}>Читать</span>
                        <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.arrow} />
                      </span>
                    </div>
                    <img className={styles.articleCardCover} src={cover} alt="" width={140} height={140} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
