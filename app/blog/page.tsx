import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { BLOG_LIST_PAGE_SIZE } from '@/lib/blogPublic';
import {
  fetchBlogCategoriesPublic,
  fetchBlogPostsThroughPages,
} from '@/lib/blogPublicServer';
import brandsStyles from '../(public)/brands/BrandsPage.module.css';
import projectsStyles from '../(public)/projects/ProjectsPage.module.css';
import blogStyles from './BlogPage.module.css';
import { BlogPostsGridWithLoadMore } from './BlogPostsGridWithLoadMore';

export const metadata: Metadata = {
  title: 'Блог — Win-Win',
  description: 'Статьи, события и материалы Win-Win',
};

/** Список и ?category= должны всегда совпадать с URL (без устаревшего кэша RSC). */
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ category?: string; page?: string }>;
};

function parseBlogListPage(raw: string | undefined): number {
  if (raw == null || raw === '') return 1;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const categoryParam = typeof sp.category === 'string' ? sp.category.trim() : '';
  const pageParam = parseBlogListPage(sp.page);
  const categories = await fetchBlogCategoriesPublic();
  /**
   * Раньше: только если slug есть в списке рубрик с API — иначе фильтр не передавался.
   * Если список рубрик пустой/ошибка — табы не могли «фильтровать» ни при каком ?category=.
   * Передаём slug в бэкенд, когда он есть и (нет списка для проверки или slug известен).
   */
  const activeCategorySlug =
    categoryParam &&
    (categories.length === 0 || categories.some((c) => c.slug === categoryParam))
      ? categoryParam
      : undefined;

  const listing = await fetchBlogPostsThroughPages({
    categorySlug: activeCategorySlug,
    throughPage: pageParam,
    pageSize: BLOG_LIST_PAGE_SIZE,
  });

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Блог', href: '', current: true },
  ];

  const tabs: { slug: string; label: string; isAll: boolean }[] = [
    { slug: '', label: 'Все статьи', isAll: true },
    ...categories.map((c) => ({ slug: c.slug, label: c.name, isAll: false })),
  ];

  return (
    <main>
      <section className={brandsStyles.mainSection} aria-label="Блог">
        <div className="padding-global">
          <div className={brandsStyles.mainSectionInner}>
            <nav className={brandsStyles.breadcrumbs} aria-label="Хлебные крошки">
              {breadcrumbs.map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className={brandsStyles.breadcrumbsSep}>/</span>}
                  {item.current ? (
                    <span className={brandsStyles.breadcrumbsCurrent}>{item.label}</span>
                  ) : (
                    <Link href={item.href} className={brandsStyles.breadcrumbsLink}>
                      {item.label}
                    </Link>
                  )}
                </Fragment>
              ))}
            </nav>

            <div className={blogStyles.blogCategoryStrip}>
              <div className={blogStyles.blogMarketRoomGroupDesktop}>
                <div className={blogStyles.blogMarketRoomGroupWrap}>
                  <div
                    className={blogStyles.blogMarketRoomGroup}
                    role="tablist"
                    aria-label="Рубрики блога"
                  >
                    {tabs.map((tab) => {
                      const isActive = tab.isAll ? !activeCategorySlug : activeCategorySlug === tab.slug;
                      const tabQs = new URLSearchParams();
                      if (!tab.isAll) tabQs.set('category', tab.slug);
                      const tabQuery = tabQs.toString();
                      const href = tabQuery ? `/blog?${tabQuery}` : '/blog';
                      return isActive ? (
                        <span
                          key={tab.isAll ? 'all' : tab.slug}
                          role="tab"
                          aria-selected={true}
                          tabIndex={0}
                          className={`${projectsStyles.marketRoomBtnActive} ${blogStyles.blogTabActive}`}
                        >
                          {tab.label}
                        </span>
                      ) : (
                        <Link
                          key={tab.isAll ? 'all' : tab.slug}
                          href={href}
                          role="tab"
                          aria-selected={false}
                          className={projectsStyles.marketRoomBtn}
                        >
                          {tab.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {listing.items.length === 0 ? (
              <p className={brandsStyles.breadcrumbsCurrent} style={{ marginTop: 24 }}>
                Пока нет статей в этой рубрике.
              </p>
            ) : (
              <BlogPostsGridWithLoadMore
                key={`blog-grid-${activeCategorySlug ?? 'all'}-${pageParam}`}
                initialItems={listing.items}
                total={listing.total}
                limit={listing.limit}
                loadedPages={listing.loadedPages}
                categorySlug={activeCategorySlug}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
