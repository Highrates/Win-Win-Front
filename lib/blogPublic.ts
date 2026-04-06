import { jsonFromResponse } from './jsonFromResponse';

export type PublicBlogCategory = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

export type PublicBlogPostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  category: { id: string; slug: string; name: string } | null;
};

export type PublicBlogPostsResponse = {
  items: PublicBlogPostCard[];
  total: number;
  page: number;
  limit: number;
};

export type PublicBlogPostDetail = PublicBlogPostCard & {
  body: string;
  author: { id: string } | null;
};

export function formatBlogDateRu(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/** Размер страницы списка на витрине блога (согласован с `/blog`). */
export const BLOG_LIST_PAGE_SIZE = 24;

/**
 * Список постов из клиентского компонента: Next Route Handler на том же origin, без RSC cache.
 * Не использовать `getServerRequestOrigin` / `next/headers` здесь — модуль импортируется с `'use client'`.
 */
export async function fetchBlogPostsPublicFresh(opts: {
  categorySlug?: string;
  page?: number;
  limit?: number;
}): Promise<PublicBlogPostsResponse> {
  const qs = new URLSearchParams();
  if (opts.categorySlug) qs.set('categorySlug', opts.categorySlug);
  qs.set('page', String(opts.page ?? 1));
  qs.set('limit', String(opts.limit ?? BLOG_LIST_PAGE_SIZE));
  const empty: PublicBlogPostsResponse = {
    items: [],
    total: 0,
    page: 1,
    limit: opts.limit ?? BLOG_LIST_PAGE_SIZE,
  };
  try {
    const res = await fetch(`/api/public/blog/posts?${qs.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return empty;
    return await jsonFromResponse(res, empty);
  } catch {
    return empty;
  }
}
