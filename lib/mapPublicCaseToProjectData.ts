import type { ProjectData } from '@/app/(public)/designers/DesignerProjectsSection';
import { resolveMediaUrlForServer } from '@/lib/publicMediaUrl';

export function parseCoverUrls(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && !!x.trim()).map((x) => x.trim());
}

/** Массив строк помещений из JSON кейса; порядок, без дублей. */
export function parseRoomTypesArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of v) {
    if (typeof x !== 'string') continue;
    const t = x.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export type PublicCaseProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  casesLinkedCount: number;
};

export type PublicCasePayload = {
  id: string;
  title: string;
  shortDescription: string | null;
  placesLine: string | null;
  /** Метки помещений из кейса (для фильтра на /projects); с бэка или из parseRoomTypesArray */
  roomTypes?: string[];
  descriptionHtml: string | null;
  coverLayout: '4:3' | '16:9';
  coverImageUrls: string[];
  products: PublicCaseProduct[];
};

export function mapPublicCaseToProjectData(
  c: PublicCasePayload,
  designer?: { slug: string; name: string; photoUrl: string | null },
): ProjectData {
  const layout = c.coverLayout;
  const rawUrls = c.coverImageUrls;
  const urls = layout === '16:9' ? rawUrls.slice(0, 1) : rawUrls.slice(0, 2);
  const coverImage = urls[0]?.trim()
    ? resolveMediaUrlForServer(urls[0])
    : '/images/placeholder.svg';
  const coverImage2 =
    layout === '16:9'
      ? undefined
      : urls[1]?.trim()
        ? resolveMediaUrlForServer(urls[1])
        : undefined;
  const gridCoverImage = urls[0]?.trim() ? resolveMediaUrlForServer(urls[0]) : coverImage;
  const out: ProjectData = {
    id: c.id,
    title: c.title,
    places: c.placesLine?.trim() ?? '',
    roomTypes: c.roomTypes?.length ? [...c.roomTypes] : [],
    description: c.shortDescription?.trim() ?? '',
    descriptionHtml: c.descriptionHtml,
    products: c.products
      .filter((p) => p.slug.trim().length > 0)
      .map((p) => ({
        productId: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl ? resolveMediaUrlForServer(p.imageUrl) : undefined,
        collections: p.casesLinkedCount,
        likes: 0,
        comments: 0,
      })),
    coverImage,
    coverImage2,
    gridCoverImage,
  };
  if (designer) {
    out.designer = {
      slug: designer.slug,
      name: designer.name,
      avatarSrc: designer.photoUrl?.trim()
        ? resolveMediaUrlForServer(designer.photoUrl)
        : '/images/placeholder.svg',
    };
  }
  return out;
}
