import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticleCategoryIds, getBlogPostBySlug, getCategoryLabel } from '../blogPosts';
import projectsStyles from '../../projects/ProjectsPage.module.css';
import blogStyles from '../BlogPage.module.css';
import articleStyles from './ArticlePage.module.css';

function CategoryArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8.25 16.5L13.75 11L8.25 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: 'Статья — Win-Win' };
  return {
    title: `${post.title} — Блог — Win-Win`,
    description: post.excerpt,
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const articleCategoryIds = getArticleCategoryIds(post);
  const coverSrc = post.coverSrc ?? '/images/placeholder.svg';
  const richIntro = post.richIntro ?? post.excerpt;
  const richSections = post.richSections?.length ? post.richSections : [];

  return (
    <main>
      <section className={articleStyles.articleMainSection} aria-label="Статья">
        <div className="padding-global">
          <header className={articleStyles.articleHeader}>
            <Link href="/blog" className={articleStyles.articleBackLink}>
              <img
                src="/icons/arrow-right.svg"
                alt=""
                width={12}
                height={7}
                className={articleStyles.articleBackArrow}
              />
              <span className={articleStyles.articleBackText}>Вернуться в блог</span>
            </Link>
            <time className={articleStyles.articleDate}>{post.date}</time>
            <h1 className={articleStyles.articleTitle}>{post.title}</h1>

            <div className={blogStyles.blogCategoryStrip}>
              <div className={blogStyles.blogMarketRoomGroupDesktop}>
                <div className={blogStyles.blogMarketRoomGroupWrap}>
                  <div
                    className={`${blogStyles.blogMarketRoomGroup} ${articleStyles.articleCategoryGroup}`}
                    role="list"
                    aria-label="Рубрики статьи"
                  >
                    {articleCategoryIds.map((catId) => (
                      <Link
                        key={catId}
                        href={`/blog?category=${catId}`}
                        role="listitem"
                        className={projectsStyles.marketRoomBtn}
                      >
                        <span className={articleStyles.categoryBtnInner}>
                          {getCategoryLabel(catId)}
                          <CategoryArrow className={articleStyles.categoryArrow} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className={articleStyles.articleLead}>{post.excerpt}</p>
          </header>

          <div className={articleStyles.articleHeroOuter}>
            <div className={articleStyles.articleHeroFrame}>
              <img
                src={coverSrc}
                alt={post.coverAlt ?? ''}
                width={800}
                height={600}
                className={articleStyles.articleHeroImage}
              />
            </div>
          </div>

          <div className={articleStyles.articleRich}>
            <p className={articleStyles.articleRichLead}>{richIntro}</p>
            {richSections.map((section, i) => (
              <div key={`${section.title}-${i}`}>
                <h3 className={articleStyles.articleRichH3}>{section.title}</h3>
                <p className={articleStyles.articleRichText}>{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
