import Link from 'next/link';
import Image from 'next/image';
import { fetchBlogCategoriesPublic, fetchBlogPostsPublic } from '@/lib/blogPublicServer';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import { NewsSourcingPromo } from './NewsSourcingPromo';
import styles from './News.module.css';

export async function News() {
  const [categories, postsRes] = await Promise.all([
    fetchBlogCategoriesPublic(),
    fetchBlogPostsPublic({ limit: 3, page: 1 }),
  ]);
  const posts = postsRes.items;

  return (
    <section className={styles.section} aria-labelledby="news-sourcing-title">
      <div className={styles.split}>
        <div className={styles.shell}>
          <div className={`padding-global ${styles.inner}`}>
            <div className={styles.titles}>
              <Image
                src="/images/logo.svg"
                alt="588est"
                width={152}
                height={22}
                className={styles.logo}
                priority
              />
              <div className={styles.categoriesWrapper}>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/blog?category=${encodeURIComponent(c.slug)}`}
                    className={styles.categoryItem}
                  >
                    {c.name}
                  </Link>
                ))}
                <Link href="/blog" className={styles.allNewsLink}>
                  <span className={styles.allNewsText}>Читать все</span>
                  <img
                    src="/icons/arrow-right.svg"
                    alt=""
                    width={12}
                    height={7}
                    className={styles.arrow}
                  />
                </Link>
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.leftCol}>
                <NewsSourcingPromo />
              </div>

              <div className={styles.rightCol}>
                {posts.length > 0 ? (
                  posts.map((p) => {
                    const cover = resolveMediaUrlForServer(p.coverUrl);
                    const cat = p.category?.name ?? '';
                    return (
                      <Link
                        key={p.id}
                        href={`/blog/${encodeURIComponent(p.slug)}`}
                        className={styles.articleCard}
                      >
                        <div className={styles.articleTitles}>
                          {cat ? (
                            <span className={styles.articleCategory}>{cat}</span>
                          ) : null}
                          <span className={styles.articleTitle}>{p.title}</span>
                          <span className={styles.newsLink}>
                            <span className={styles.newsLinkText}>Читать</span>
                            <img
                              src="/icons/arrow-right.svg"
                              alt=""
                              width={12}
                              height={7}
                              className={styles.arrow}
                            />
                          </span>
                        </div>
                        <span className={styles.articleCardCoverWrap}>
                          <Image
                            src={cover}
                            alt=""
                            fill
                            className={styles.articleCardCover}
                            sizes="140px"
                            loading="lazy"
                            unoptimized
                          />
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <p className={styles.emptyNews}>Скоро здесь появятся новости</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
