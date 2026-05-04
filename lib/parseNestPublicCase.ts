import type { PublicCasePayload, PublicCaseProduct } from '@/lib/mapPublicCaseToProjectData';
import { parseCoverUrls, parseRoomTypesArray } from '@/lib/mapPublicCaseToProjectData';

export type NestPublicCaseDesignerMeta = {
  slug: string;
  name: string;
  photoUrl: string | null;
};

export type ParseNestPublicCaseOptions = {
  /** Без пары designerSlug + designerDisplayName вернёт `null` (ответ `GET /designers/cases`). */
  requireDesignerMeta?: boolean;
};

function parseProductRow(q: Record<string, unknown>): PublicCaseProduct {
  const id = typeof q.id === 'string' && q.id.trim() ? q.id.trim() : '';
  const ccr = q.casesLinkedCount;
  const casesLinkedCount =
    typeof ccr === 'number' && Number.isFinite(ccr) ? Math.max(0, Math.floor(ccr)) : 0;
  return {
    id,
    slug: typeof q.slug === 'string' ? q.slug : '',
    name: typeof q.name === 'string' ? q.name : 'Товар',
    price: typeof q.price === 'number' && Number.isFinite(q.price) ? q.price : 0,
    imageUrl: typeof q.imageUrl === 'string' ? q.imageUrl : null,
    casesLinkedCount,
  };
}

function parseProductsArray(raw: unknown): PublicCaseProduct[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicCaseProduct[] = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    out.push(parseProductRow(p as Record<string, unknown>));
  }
  return out;
}

/**
 * Разбор одного кейса из JSON Nest (`cases[]` у дизайнера или `items[]` у `/designers/cases`).
 * Поля совпадают с контрактом API — правки формата делаются здесь.
 */
export function parseNestPublicCaseItem(
  row: unknown,
  opts?: ParseNestPublicCaseOptions,
): { case: PublicCasePayload; designer: NestPublicCaseDesignerMeta | null } | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id : '';
  if (!id) return null;

  const designerSlug = typeof o.designerSlug === 'string' ? o.designerSlug.trim() : '';
  const designerDisplayName =
    typeof o.designerDisplayName === 'string' ? o.designerDisplayName.trim() : '';
  const designer: NestPublicCaseDesignerMeta | null =
    designerSlug && designerDisplayName
      ? {
          slug: designerSlug,
          name: designerDisplayName,
          photoUrl: typeof o.designerPhotoUrl === 'string' ? o.designerPhotoUrl : null,
        }
      : null;

  if (opts?.requireDesignerMeta && !designer) return null;

  const casePayload: PublicCasePayload = {
    id,
    title: String(o.title ?? ''),
    shortDescription: typeof o.shortDescription === 'string' ? o.shortDescription : null,
    placesLine: typeof o.placesLine === 'string' ? o.placesLine : null,
    roomTypes: parseRoomTypesArray(o.roomTypes),
    descriptionHtml: typeof o.descriptionHtml === 'string' ? o.descriptionHtml : null,
    coverLayout: o.coverLayout === '16:9' ? '16:9' : '4:3',
    coverImageUrls: parseCoverUrls(o.coverImageUrls),
    products: parseProductsArray(o.products),
  };

  return { case: casePayload, designer };
}
