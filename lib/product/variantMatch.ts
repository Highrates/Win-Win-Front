import type {
  PublicProductElementApi,
  PublicProductVariantApi,
} from '@/lib/publicProductFromApi';
import {
  formatProductPriceRangeRub,
  formatProductPriceRub,
  parseProductPriceFromApi,
} from '@/lib/productSpecsFromApi';

export function buildInitialSelections(
  elements: PublicProductElementApi[],
  variants: PublicProductVariantApi[],
  anchorVariantId: string | null,
): Record<string, string> {
  const result: Record<string, string> = {};
  const anchor = anchorVariantId
    ? variants.find((v) => v.id === anchorVariantId) ?? null
    : null;
  for (const el of elements) {
    if (el.availabilities.length === 0) continue;
    const fromAnchor = anchor?.selections.find((s) => s.productElementId === el.id);
    if (
      fromAnchor &&
      el.availabilities.some((a) => a.brandMaterialColorId === fromAnchor.brandMaterialColorId)
    ) {
      result[el.id] = fromAnchor.brandMaterialColorId;
      continue;
    }
    result[el.id] = el.availabilities[0]!.brandMaterialColorId;
  }
  return result;
}

/** Точно совпадающий вариант для (modificationId, selections). */
export function findExactVariant(
  variants: PublicProductVariantApi[],
  elements: PublicProductElementApi[],
  modificationId: string | null,
  selections: Record<string, string>,
): PublicProductVariantApi | null {
  if (!modificationId) return null;
  const requiredElementIds = elements
    .filter((el) => el.availabilities.length > 0)
    .map((el) => el.id);
  for (const v of variants) {
    if (v.modificationId !== modificationId) continue;
    if (v.selections.length !== requiredElementIds.length) continue;
    const byElement = new Map(v.selections.map((s) => [s.productElementId, s.brandMaterialColorId]));
    const ok = requiredElementIds.every(
      (eid) => selections[eid] && byElement.get(eid) === selections[eid],
    );
    if (ok) return v;
  }
  return null;
}

export function getSoleModificationId(
  modifications: { id: string }[],
): string | null {
  return modifications.length === 1 ? (modifications[0]?.id ?? null) : null;
}

export function isConfigurationReadyForProject(
  elements: PublicProductElementApi[],
  effectiveModificationId: string | null,
  selections: Record<string, string>,
): boolean {
  if (!effectiveModificationId) return false;
  const required = elements.filter((el) => el.availabilities.length > 0);
  return required.every((el) => Boolean(selections[el.id]));
}

export function resolvePdpPriceText(params: {
  modificationId: string | null;
  matchedVariant: PublicProductVariantApi | null;
  priceMin: number;
  priceMax: number;
}): string {
  const { modificationId, matchedVariant, priceMin, priceMax } = params;
  if (modificationId && matchedVariant) {
    const n = parseProductPriceFromApi(matchedVariant.price);
    if (n > 0) return formatProductPriceRub(n);
  }
  if (priceMin > 0 && priceMax > 0 && priceMax > priceMin) {
    return formatProductPriceRangeRub(priceMin, priceMax);
  }
  if (priceMin > 0) return formatProductPriceRub(priceMin);
  return '—';
}

export function resolvePdpGalleryImages(params: {
  modificationId: string | null;
  matchedVariant: PublicProductVariantApi | null;
  variantImagesMap: Record<string, string[]>;
  productImages: string[];
}): string[] {
  const { modificationId, matchedVariant, variantImagesMap, productImages } = params;
  if (modificationId && matchedVariant) {
    const imgs = variantImagesMap[matchedVariant.id];
    if (imgs && imgs.length > 0) return imgs;
  }
  return productImages;
}
