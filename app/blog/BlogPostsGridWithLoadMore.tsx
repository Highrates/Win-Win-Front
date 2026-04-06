'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  fetchBlogPostsPublicFresh,
  formatBlogDateRu,
  type PublicBlogPostCard,
} from '@/lib/blogPublic';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import blogStyles from './BlogPage.module.css';

type Props = {
  initialItems: PublicBlogPostCard[];
  total: number;
  limit: number;
  loadedPages: number;
  categorySlug?: string;
};

function syncBlogListUrl(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  categorySlug: string | undefined,
  pageCount: number,
) {
  const qs = new URLSearchParams();
  if (categorySlug) qs.set('category', categorySlug);
  if (pageCount > 1) qs.set('page', String(pageCount));
  const q = qs.toString();
  router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
}

export function BlogPostsGridWithLoadMore({
  initialItems,
  total,
  limit,
  loadedPages: initialLoadedPages,
  categorySlug,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<PublicBlogPostCard[]>(initialItems);
  const [loadedPages, setLoadedPages] = useState(initialLoadedPages);
  const [loading, setLoading] = useState(false);

  const hasMore = items.length < total;

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = loadedPages + 1;
    setLoading(true);
    try {
      const res = await fetchBlogPostsPublicFresh({
        categorySlug,
        page: nextPage,
        limit,
      });
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const item of res.items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        return merged;
      });
      setLoadedPages(nextPage);
      syncBlogListUrl(router, pathname, categorySlug, nextPage);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, loadedPages, limit, categorySlug, router, pathname]);

  return (
    <>
      <div className={blogStyles.articlesGrid}>
        {items.map((post) => {
          const cover = resolveMediaUrlForClient(post.coverUrl);
          const dateLine = formatBlogDateRu(post.publishedAt);
          return (
            <Link key={post.id} href={`/blog/${post.slug}`} className={blogStyles.articleCard}>
              <img
                src={cover}
                alt=""
                className={blogStyles.articleCardCover}
                width={400}
                height={400}
              />
              <span className={blogStyles.articleCardMeta}>
                {[dateLine, post.category?.name].filter(Boolean).join(' · ') || '—'}
              </span>
              <h2 className={blogStyles.articleCardTitle}>{post.title}</h2>
            </Link>
          );
        })}
      </div>
      {hasMore ? (
        <div className={blogStyles.loadMoreWrapper}>
          <button
            type="button"
            className={blogStyles.loadMoreBtn}
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Загрузка…' : 'Загрузить еще'}
          </button>
        </div>
      ) : null}
    </>
  );
}
