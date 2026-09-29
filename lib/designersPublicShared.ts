import type { Metadata } from 'next';
import type { ProjectData } from '@/app/(site)/(public)/designers/DesignerProjectsSection';
import { plainTextExcerptFromHtml } from '@/lib/brandsPublic';
import { SITE_NAME } from '@/lib/brand';
import {
  mapPublicCaseToProjectData,
  parseCoverUrls,
  type PublicCasePayload,
} from '@/lib/mapPublicCaseToProjectData';
import { parseNestPublicCaseItem } from '@/lib/parseNestPublicCase';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';

export const DESIGNER_CASES_PAGE_SIZE = 36;
export const PUBLIC_CASES_PAGE_SIZE = 48;
/** Единый revalidate для RSC и BFF `/api/public/designers*`. */
export const DESIGNER_PUBLIC_REVALIDATE_SECONDS = 60;

export type PublicDesignerPayload = {
  id: string;
  slug: string;
  displayName: string;
  photoUrl: string | null;
  city: string | null;
  servicesLine: string | null;
  likesDisplayCount: number;
  casesCount: number;
  casesPage: number;
  casesLimit: number;
  casesTotal: number;
  coverLayout: '4:3' | '16:9';
  coverImageUrls: string[];
  aboutHtml: string | null;
  cases: PublicCasePayload[];
};

export function parsePublicDesignerPayload(
  raw: Record<string, unknown>,
  slugFallback: string,
): PublicDesignerPayload {
  const coverUrls = parseCoverUrls(raw.coverImageUrls).map((u) => resolveMediaUrlForServer(u));
  const layoutRaw = raw.coverLayout === '16:9' ? '16:9' : '4:3';
  const cases: PublicCasePayload[] = [];
  if (Array.isArray(raw.cases)) {
    for (const row of raw.cases) {
      const parsed = parseNestPublicCaseItem(row);
      if (parsed) cases.push(parsed.case);
    }
  }
  const casesTotal =
    typeof raw.casesTotal === 'number'
      ? raw.casesTotal
      : typeof raw.casesCount === 'number'
        ? raw.casesCount
        : cases.length;
  const photoRaw = typeof raw.photoUrl === 'string' ? raw.photoUrl.trim() : '';
  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? slugFallback),
    displayName: String(raw.displayName ?? ''),
    photoUrl: photoRaw ? resolveMediaUrlForServer(photoRaw) : null,
    city: typeof raw.city === 'string' ? raw.city : null,
    servicesLine: typeof raw.servicesLine === 'string' ? raw.servicesLine : null,
    likesDisplayCount: typeof raw.likesDisplayCount === 'number' ? raw.likesDisplayCount : 0,
    casesCount: typeof raw.casesCount === 'number' ? raw.casesCount : casesTotal,
    casesPage: typeof raw.casesPage === 'number' ? raw.casesPage : 1,
    casesLimit: typeof raw.casesLimit === 'number' ? raw.casesLimit : DESIGNER_CASES_PAGE_SIZE,
    casesTotal,
    coverLayout: layoutRaw,
    coverImageUrls: coverUrls,
    aboutHtml: typeof raw.aboutHtml === 'string' ? raw.aboutHtml : null,
    cases,
  };
}

export function designerProjectsFromPayload(designer: PublicDesignerPayload): ProjectData[] {
  return designer.cases.map((c) => mapPublicCaseToProjectData(c));
}

export function designerPageMetadata(
  designer: PublicDesignerPayload,
  opts?: { siteOrigin?: string | null },
): Metadata {
  const name = designer.displayName.trim() || 'Дизайнер';
  const title = `${name} — Дизайнер — ${SITE_NAME}`;
  const fromAbout = plainTextExcerptFromHtml(designer.aboutHtml, 200);
  const bits = [
    designer.city?.trim(),
    designer.servicesLine?.trim(),
    designer.casesCount > 0 ? `${designer.casesCount} проектов` : null,
  ].filter(Boolean);
  const description =
    fromAbout ||
    (bits.length ? `${name}: ${bits.join(' · ')}` : undefined) ||
    `Дизайнер ${name} на ${SITE_NAME}`;

  const coverPath = designer.coverImageUrls[0]?.trim() || designer.photoUrl?.trim() || null;
  const coverAbsolute =
    coverPath && opts?.siteOrigin && coverPath.startsWith('/')
      ? `${opts.siteOrigin}${coverPath}`
      : coverPath && /^https?:\/\//i.test(coverPath)
        ? coverPath
        : undefined;

  const pageUrl = opts?.siteOrigin
    ? `${opts.siteOrigin}/designers/${encodeURIComponent(designer.slug)}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title: name,
      description,
      type: 'profile',
      ...(pageUrl ? { url: pageUrl } : {}),
      ...(coverAbsolute ? { images: [{ url: coverAbsolute, alt: name }] } : {}),
    },
  };
}
