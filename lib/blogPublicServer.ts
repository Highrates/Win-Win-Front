/**
 * Только для Server Components: прямые запросы к бэкенду (как `brandsPublic`).
 * Клиентские компоненты импортируют `@/lib/blogPublic` и `/api/public/blog/*`.
 */
import { jsonFromResponse } from './jsonFromResponse';
import { getServerApiBase } from './serverApiBase';
import type {
  PublicBlogCategory,
  PublicBlogPostCard,
  PublicBlogPostDetail,
  PublicBlogPostsResponse,
} from './blogPublic';
import { BLOG_LIST_PAGE_SIZE } from './blogPublic';

const BLOG_REVALIDATE_SECONDS = 60;

type NextFetchInit = RequestInit & { next?: { revalidate: number } };

async function fetchBlogBackend(pathAfterBlog: string, mode: 'list' | 'detail'): Promise<Response> {
  const init: NextFetchInit =
    mode === 'detail'
      ? { cache: 'no-store', headers: { Accept: 'application/json' } }
      : {
          next: { revalidate: BLOG_REVALIDATE_SECONDS },
          headers: { Accept: 'application/json' },
        };
  return fetch(`${getServerApiBase()}/blog/${pathAfterBlog}`, init);
}

/** Рубрики, в которых есть опубликованные статьи. */
export async function fetchBlogCategoriesPublic(): Promise<PublicBlogCategory[]> {
  try {
    const res = await fetchBlogBackend('categories', 'list');
    if (!res.ok) return [];
    return await jsonFromResponse<PublicBlogCategory[]>(res, []);
  } catch {
    return [];
  }
}

export async function fetchBlogPostsPublic(opts: {
  categorySlug?: string;
  page?: number;
  limit?: number;
}): Promise<PublicBlogPostsResponse> {
  const qs = new URLSearchParams();
  if (opts.categorySlug) qs.set('categorySlug', opts.categorySlug);
  qs.set('page', String(opts.page ?? 1));
  qs.set('limit', String(opts.limit ?? 20));
  const empty: PublicBlogPostsResponse = { items: [], total: 0, page: 1, limit: opts.limit ?? 20 };
  try {
    const res = await fetchBlogBackend(`posts?${qs.toString()}`, 'list');
    if (!res.ok) return empty;
    return await jsonFromResponse(res, empty);
  } catch {
    return empty;
  }
}

export async function fetchBlogPostsThroughPages(opts: {
  categorySlug?: string;
  throughPage: number;
  pageSize?: number;
}): Promise<{
  items: PublicBlogPostCard[];
  total: number;
  limit: number;
  loadedPages: number;
}> {
  const limit = opts.pageSize ?? BLOG_LIST_PAGE_SIZE;
  const raw = Math.floor(Number(opts.throughPage));
  const requested = Number.isFinite(raw) && raw >= 1 ? raw : 1;
  const throughPage = Math.min(requested, 500);

  const first = await fetchBlogPostsPublic({
    categorySlug: opts.categorySlug,
    page: 1,
    limit,
  });
  const total = first.total;
  const maxPage = Math.max(1, Math.ceil(total / limit) || 1);
  const pagesToLoad = Math.min(throughPage, maxPage);

  if (pagesToLoad <= 1) {
    return {
      items: first.items,
      total,
      limit,
      loadedPages: 1,
    };
  }

  const rest = await Promise.all(
    Array.from({ length: pagesToLoad - 1 }, (_, i) =>
      fetchBlogPostsPublic({
        categorySlug: opts.categorySlug,
        page: i + 2,
        limit,
      }),
    ),
  );

  const seen = new Set(first.items.map((x) => x.id));
  const items = [...first.items];
  for (const batch of rest) {
    for (const item of batch.items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    }
  }

  return { items, total, limit, loadedPages: pagesToLoad };
}

function isBlogPostDetail(data: unknown): data is PublicBlogPostDetail {
  return (
    !!data &&
    typeof data === 'object' &&
    'slug' in data &&
    typeof (data as { slug: unknown }).slug === 'string' &&
    'body' in data &&
    typeof (data as { body: unknown }).body === 'string'
  );
}

export async function fetchBlogPostBySlugPublic(slug: string): Promise<PublicBlogPostDetail | null> {
  const s = slug.trim();
  if (!s) return null;
  try {
    const res = await fetchBlogBackend(`posts/${encodeURIComponent(s)}`, 'detail');
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await jsonFromResponse<unknown>(res, null);
    return isBlogPostDetail(data) ? data : null;
  } catch {
    return null;
  }
}
