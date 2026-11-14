import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/brand';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';
import type { ChinaTourDetail, ChinaToursLanding } from './types';

export const TOURS_LIST_DESCRIPTION =
  'Мебельные туры WUPAPA в Китай для дизайнеров и блогеров: небольшие группы и насыщенная программа.';

function absMedia(url: string | null | undefined, siteOrigin?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const path = resolveMediaUrlForServer(url.trim());
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (siteOrigin && path.startsWith('/')) return `${siteOrigin}${path}`;
  return path;
}

export function toursListMetadata(opts?: {
  landing?: ChinaToursLanding | null;
  siteOrigin?: string | null;
}): Metadata {
  const title = `Туры в Китай — ${SITE_NAME}`;
  const description = opts?.landing?.description?.trim().slice(0, 160) || TOURS_LIST_DESCRIPTION;
  const image = absMedia(opts?.landing?.imageUrl, opts?.siteOrigin);
  const canonical = opts?.siteOrigin ? `${opts.siteOrigin}/tours` : undefined;
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(canonical ? { url: canonical } : {}),
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
  };
}

export function tourDetailMetadata(
  tour: ChinaTourDetail,
  opts?: { siteOrigin?: string | null },
): Metadata {
  const title = `${tour.title} — Туры в Китай — ${SITE_NAME}`;
  const description = tour.cardText?.slice(0, 160) || `Программа тура «${tour.title}»`;
  const image = absMedia(tour.cardPrimaryUrl ?? tour.days[0]?.heroUrl, opts?.siteOrigin);
  const canonical = opts?.siteOrigin
    ? `${opts.siteOrigin}/tours/${encodeURIComponent(tour.slug)}`
    : undefined;
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: tour.title,
      description,
      type: 'website',
      ...(canonical ? { url: canonical } : {}),
      ...(image ? { images: [{ url: image, alt: tour.title }] } : {}),
    },
  };
}
