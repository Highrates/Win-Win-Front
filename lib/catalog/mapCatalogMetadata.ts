import type { Metadata } from 'next';
import type { CatalogCategoryBySlugApi, PublicCatalogTag } from '@/lib/catalogPublic';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';

const SITE = '588est';

export const CATALOG_HUB_DESCRIPTION = 'Каталог мебели и предметов интерьера';

function absoluteMediaUrl(path: string | null, siteOrigin?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (siteOrigin && path.startsWith('/')) return `${siteOrigin}${path}`;
  return path;
}

export function catalogHubMetadata(opts?: { siteOrigin?: string | null }): Metadata {
  const title = `Каталог — ${SITE}`;
  const description = CATALOG_HUB_DESCRIPTION;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(opts?.siteOrigin ? { url: `${opts.siteOrigin}/catalog` } : {}),
    },
  };
}

export function catalogCategoryNotFoundMetadata(): Metadata {
  return { title: `Каталог — ${SITE}` };
}

export function catalogCategoryMetadataFromCategory(
  category: CatalogCategoryBySlugApi,
  opts?: {
    activeTag?: PublicCatalogTag | null;
    /** Имя активной подкатегории из `?sub=`. */
    subName?: string | null;
    siteOrigin?: string | null;
  },
): Metadata {
  const tagSuffix = opts?.activeTag ? ` · ${opts.activeTag.name}` : '';
  const subSuffix = opts?.subName?.trim() ? ` · ${opts.subName.trim()}` : '';
  const title =
    category.seoTitle?.trim() || `${category.name}${subSuffix}${tagSuffix} — Каталог — ${SITE}`;
  const description =
    category.seoDescription?.trim() ||
    (opts?.subName?.trim()
      ? `${opts.subName.trim()} — ${category.name}`
      : opts?.activeTag
        ? `${category.name} — зона «${opts.activeTag.name}»`
        : `Категория: ${category.name}`);
  const imagePath = category.backgroundImageUrl
    ? resolveMediaUrlForServer(category.backgroundImageUrl)
    : null;
  const imageAbsolute = absoluteMediaUrl(imagePath, opts?.siteOrigin);
  const ogTitle = opts?.subName?.trim()
    ? `${opts.subName.trim()} · ${category.name}`
    : opts?.activeTag
      ? `${category.name} · ${opts.activeTag.name}`
      : category.name;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      ...(imageAbsolute ? { images: [{ url: imageAbsolute, alt: category.name }] } : {}),
    },
  };
}

export function catalogTagNotFoundMetadata(): Metadata {
  return { title: `Каталог — ${SITE}` };
}

export function catalogTagMetadataFromTag(
  tag: PublicCatalogTag,
  opts?: { siteOrigin?: string | null },
): Metadata {
  const title = `${tag.name} — Каталог — ${SITE}`;
  const description = `Каталог: ${tag.name}`;
  const coverPath = tag.coverImageUrl ? resolveMediaUrlForServer(tag.coverImageUrl) : null;
  const coverAbsolute = absoluteMediaUrl(coverPath, opts?.siteOrigin);

  return {
    title,
    description,
    openGraph: {
      title: tag.name,
      description,
      type: 'website',
      ...(coverAbsolute ? { images: [{ url: coverAbsolute, alt: tag.name }] } : {}),
      ...(opts?.siteOrigin
        ? { url: `${opts.siteOrigin}/catalog?tag=${encodeURIComponent(tag.slug)}` }
        : {}),
    },
  };
}
