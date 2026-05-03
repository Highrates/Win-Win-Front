import type { SyntheticEvent } from 'react';

export const PRODUCT_CARD_PLACEHOLDER = '/images/placeholder.svg';

/** Как в `ProductCard`: при непустом `imageUrls` берём галерею, иначе одиночный `imageUrl`. */
export function normalizeProductCardImageUrls(
  imageUrl: string | undefined,
  imageUrls: string[] | undefined,
): string[] {
  const fromList = (imageUrls ?? []).map((u) => u?.trim()).filter(Boolean) as string[];
  if (fromList.length > 0) {
    const seen = new Set<string>();
    return fromList.filter((u) => (seen.has(u) ? false : (seen.add(u), true)));
  }
  if (imageUrl?.trim()) return [imageUrl.trim()];
  return [PRODUCT_CARD_PLACEHOLDER];
}

export function productCardImageOnError(ev: SyntheticEvent<HTMLImageElement>): void {
  const el = ev.currentTarget;
  const ph = PRODUCT_CARD_PLACEHOLDER;
  if (el.src !== ph && !el.src.endsWith(ph)) {
    el.src = ph;
  }
}
