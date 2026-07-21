import type { Metadata } from 'next';
import type { PublicBlogPostDetail } from '@/lib/blogPublic';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';

const SITE = '588est';

export const BLOG_LIST_DESCRIPTION = 'Статьи, события и материалы 588est';

export function blogListMetadata(): Metadata {
  return {
    title: `Блог — ${SITE}`,
    description: BLOG_LIST_DESCRIPTION,
    openGraph: {
      title: `Блог — ${SITE}`,
      description: BLOG_LIST_DESCRIPTION,
      type: 'website',
    },
  };
}

export function blogArticleNotFoundMetadata(): Metadata {
  return { title: `Статья — ${SITE}` };
}

export function blogArticleMetadataFromPost(
  post: PublicBlogPostDetail,
  opts?: { siteOrigin?: string | null },
): Metadata {
  const title = `${post.title} — Блог — ${SITE}`;
  const description = post.excerpt?.trim() || undefined;
  const coverPath = post.coverUrl ? resolveMediaUrlForServer(post.coverUrl) : null;
  const coverAbsolute =
    coverPath && opts?.siteOrigin && coverPath.startsWith('/')
      ? `${opts.siteOrigin}${coverPath}`
      : coverPath ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      ...(coverAbsolute ? { images: [{ url: coverAbsolute, alt: post.title }] } : {}),
    },
  };
}
