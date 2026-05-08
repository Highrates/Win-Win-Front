import type {
  PublicProductElementApi,
  PublicProductModificationApi,
  PublicProductVariantApi,
} from '@/lib/publicProductFromApi';
import type { PdpProjectDraftPayload } from '@/lib/designerProjects/pdpDraft';
import { parseProductPriceFromApi } from '@/lib/productSpecsFromApi';

export function buildPdpProjectDraftPayload(params: {
  productId: string;
  productSlug: string;
  productDisplayName: string;
  modifications: PublicProductModificationApi[];
  elements: PublicProductElementApi[];
  thumbUrl: string | null;
  modificationId: string | null;
  selections: Record<string, string>;
  /** Если есть точный вариант SKU — цена и variantId; иначе строка проекта всё равно сохраняется с `variantId: null`. */
  matchedVariant: PublicProductVariantApi | null;
  /** Диапазон цен карточки товара (как на PDP), сохраняется в snapshot при отсутствии SKU. */
  catalogPriceMinRub: number;
  catalogPriceMaxRub: number;
}): PdpProjectDraftPayload {
  const mod = params.modifications.find((m) => m.id === params.modificationId);
  const modificationLabel = mod?.name?.trim() || null;

  const elementMaterialRows: { elementLabel: string; materialColorLabel: string }[] = [];
  const sortedElements = [...params.elements].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const el of sortedElements) {
    if (el.availabilities.length === 0) continue;
    const bmcId = params.selections[el.id];
    const av = bmcId ? el.availabilities.find((a) => a.brandMaterialColorId === bmcId) : undefined;
    const materialColorLabel = av
      ? `${av.materialName.trim()} — ${av.colorName.trim()}`.trim()
      : '—';
    elementMaterialRows.push({
      elementLabel: el.name.trim() || 'Элемент',
      materialColorLabel,
    });
  }

  let priceRub: number | null = null;
  if (params.matchedVariant) {
    const n = parseProductPriceFromApi(params.matchedVariant.price);
    priceRub = n > 0 ? n : null;
  }

  let catalogPriceMinRub: number | null = null;
  let catalogPriceMaxRub: number | null = null;
  if (
    !params.matchedVariant &&
    params.catalogPriceMinRub > 0 &&
    params.catalogPriceMaxRub > 0 &&
    params.catalogPriceMaxRub >= params.catalogPriceMinRub
  ) {
    catalogPriceMinRub = params.catalogPriceMinRub;
    catalogPriceMaxRub = params.catalogPriceMaxRub;
  }

  return {
    productId: params.productId,
    productSlug: params.productSlug,
    productName: params.productDisplayName.trim() || 'Товар',
    variantId: params.matchedVariant?.id ?? null,
    modificationLabel,
    elementMaterialRows,
    priceRub,
    catalogPriceMinRub,
    catalogPriceMaxRub,
    imageUrl: thumbUrlOrNull(params.thumbUrl),
  };
}

function thumbUrlOrNull(url: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  return t.length > 0 ? t : null;
}
