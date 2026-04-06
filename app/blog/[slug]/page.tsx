import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatBlogDateRu } from '@/lib/blogPublic';
import { fetchBlogPostBySlugPublic } from '@/lib/blogPublicServer';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import projectsStyles from '../../(public)/projects/ProjectsPage.module.css';
import blogStyles from '../BlogPage.module.css';
import articleStyles from './ArticlePage.module.css';

export const dynamic = 'force-dynamic';

function safeDecodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

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
  const { slug: raw } = await params;
  const slug = safeDecodeSlug(raw);
  if (!slug) return { title: 'Статья — Win-Win' };
  const post = await fetchBlogPostBySlugPublic(slug);
  if (!post) return { title: 'Статья — Win-Win' };
  return {
    title: `${post.title} — Блог — Win-Win`,
    description: post.excerpt?.trim() || undefined,
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = safeDecodeSlug(raw);
  if (!slug) notFound();
  const post = await fetchBlogPostBySlugPublic(slug);
  if (!post) notFound();

  const coverSrc = resolveMediaUrlForServer(post.coverUrl);
  const dateLine = formatBlogDateRu(post.publishedAt);

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
            {dateLine ? <time className={articleStyles.articleDate}>{dateLine}</time> : null}
            <h1 className={articleStyles.articleTitle}>{post.title}</h1>

            {post.category ? (
              <div className={blogStyles.blogCategoryStrip}>
                <div className={blogStyles.blogMarketRoomGroupDesktop}>
                  <div className={blogStyles.blogMarketRoomGroupWrap}>
                    <div
                      className={`${blogStyles.blogMarketRoomGroup} ${articleStyles.articleCategoryGroup}`}
                      role="list"
                      aria-label="Рубрика статьи"
                    >
                      <Link
                        href={`/blog?category=${encodeURIComponent(post.category.slug)}`}
                        role="listitem"
                        className={projectsStyles.marketRoomBtn}
                      >
                        <span className={articleStyles.categoryBtnInner}>
                          {post.category.name}
                          <CategoryArrow className={articleStyles.categoryArrow} />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {post.excerpt?.trim() ? <p className={articleStyles.articleLead}>{post.excerpt.trim()}</p> : null}
          </header>

          <div className={articleStyles.articleHeroOuter}>
            <div className={articleStyles.articleHeroFrame}>
              <img
                src={coverSrc}
                alt=""
                width={800}
                height={600}
                className={articleStyles.articleHeroImage}
              />
            </div>
          </div>

          {/* HTML уже санитизирован на API (DOMPurify); повторная санитизация на клиенте не требуется. */}
          <div
            className="rich-content"
            dangerouslySetInnerHTML={{ __html: post.body }}
            suppressHydrationWarning
          />
        </div>
      </section>
    </main>
  );
}
