import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import brandsStyles from '../brands/BrandsPage.module.css';
import projectsStyles from '../projects/ProjectsPage.module.css';
import blogStyles from './BlogPage.module.css';

export const metadata: Metadata = {
  title: 'Блог — Win-Win',
  description: 'Статьи, события и материалы Win-Win',
};

const BLOG_CATEGORIES = [
  { id: 'all', label: 'Все статьи' },
  { id: 'events', label: 'События' },
  { id: 'brands', label: 'Бренды' },
  { id: 'interviews', label: 'Интервью' },
  { id: 'guides', label: 'Гиды' },
] as const;

const BLOG_POSTS = [
  { slug: 'novaya-kollekciya', title: 'Новая коллекция мебели 2025 года уже в каталоге', category: 'events', date: '15 января 2025' },
  { slug: 'trendy-interera', title: 'Тренды интерьера: что останется в моде', category: 'guides', date: '10 января 2025' },
  { slug: 'sovety-dizajneram', title: 'Советы начинающим дизайнерам', category: 'interviews', date: '5 января 2025' },
  { slug: 'brend-istoriya', title: 'История бренда: от мастерской до шоурума', category: 'brands', date: '1 января 2025' },
  { slug: 'vystavka-moskva', title: 'События сезона: выставка в Москве', category: 'events', date: '28 декабря 2024' },
  { slug: 'materialy-gid', title: 'Гид по отделочным материалам', category: 'guides', date: '20 декабря 2024' },
];

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const { category: categoryParam } = await searchParams;
  const currentCategory =
    categoryParam && BLOG_CATEGORIES.some((c) => c.id === categoryParam) ? categoryParam : 'all';

  const filteredPosts =
    currentCategory === 'all'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.category === currentCategory);

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Блог', href: '', current: true },
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
                    {BLOG_CATEGORIES.map((tab) => {
                      const isActive = tab.id === currentCategory;
                      const href =
                        tab.id === 'all' ? '/blog' : `/blog?category=${tab.id}`;
                      return isActive ? (
                        <span
                          key={tab.id}
                          role="tab"
                          aria-selected
                          className={projectsStyles.marketRoomBtnActive}
                        >
                          {tab.label}
                        </span>
                      ) : (
                        <Link
                          key={tab.id}
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

            <div className={blogStyles.articlesGrid}>
              {filteredPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className={blogStyles.articleCard}>
                  <img
                    src="/images/placeholder.svg"
                    alt=""
                    className={blogStyles.articleCardCover}
                    width={400}
                    height={400}
                  />
                  <span className={blogStyles.articleCardMeta}>{post.date}</span>
                  <h2 className={blogStyles.articleCardTitle}>{post.title}</h2>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
