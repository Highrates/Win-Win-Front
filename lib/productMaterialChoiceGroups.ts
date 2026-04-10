import type { PublicProductFromApi, PublicProductVariantApi } from './publicProductFromApi';
import {
  formatProductPriceRub,
  parseProductPriceFromApi,
  parseProductSpecsFromApi,
} from './productSpecsFromApi';

export type MaterialChoiceCard = {
  variantId: string;
  /** Ссылка `?vs=` вместо `?v=` когда задан. */
  variantSlug: string | null;
  colorLabel: string;
  imageUrl: string;
  price: number;
  priceLabel: string;
};

export type MaterialChoiceGroup = {
  materialTitle: string;
  cards: MaterialChoiceCard[];
};

function parseMaterialColorFromOptionAttributes(raw: unknown): { material?: string; color?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const material =
    (typeof o.material === 'string' && o.material.trim()) ||
    (typeof o['материал'] === 'string' && o['материал'].trim()) ||
    undefined;
  const color =
    (typeof o.color === 'string' && o.color.trim()) ||
    (typeof o['цвет'] === 'string' && o['цвет'].trim()) ||
    undefined;
  return { material: material || undefined, color: color || undefined };
}

/** Сначала optionAttributes; иначе ровно один материал и один цвет в specsJson варианта (типичный SKU). */
function deriveMaterialColorForVariant(v: PublicProductVariantApi): { material?: string; color?: string } {
  const fromOpt = parseMaterialColorFromOptionAttributes(v.optionAttributes);
  if (fromOpt.material && fromOpt.color) return fromOpt;

  const specs = parseProductSpecsFromApi(v.specsJson);
  if (specs.materials.length === 1 && specs.colors.length === 1) {
    return { material: specs.materials[0], color: specs.colors[0].name };
  }
  return {};
}

function pickVariantCardImageUrl(
  v: PublicProductVariantApi,
  colorName: string,
  product: PublicProductFromApi,
  resolveMedia: (url: string | null | undefined) => string,
): string {
  const first = v.images?.[0]?.url;
  if (first?.trim()) return resolveMedia(first);
  const specs = parseProductSpecsFromApi(v.specsJson);
  const byName = specs.colors.find((c) => c.name.trim() === colorName.trim());
  if (byName?.imageUrl?.trim()) return resolveMedia(byName.imageUrl);
  return resolveMedia(product.images[0]?.url);
}

/**
 * Группирует варианты по материалу; каждая карточка — SKU «материал + цвет».
 * Источник: `optionAttributes` **или** в specsJson варианта ровно один материал и один цвет.
 */
export function buildMaterialChoiceGroups(
  product: PublicProductFromApi,
  resolveMedia: (url: string | null | undefined) => string,
): MaterialChoiceGroup[] | null {
  const variants = product.variants;
  if (!variants.length) return null;

  const rows: { variant: PublicProductVariantApi; material: string; color: string }[] = [];
  for (const v of variants) {
    const { material, color } = deriveMaterialColorForVariant(v);
    if (!material || !color) continue;
    rows.push({ variant: v, material, color });
  }
  if (!rows.length) return null;

  const materialOrder: string[] = [];
  for (const r of rows) {
    if (!materialOrder.includes(r.material)) materialOrder.push(r.material);
  }

  const groups: MaterialChoiceGroup[] = [];
  for (const title of materialOrder) {
    const cards: MaterialChoiceCard[] = [];
    for (const r of rows) {
      if (r.material !== title) continue;
      const v = r.variant;
      const price = parseProductPriceFromApi(v.price);
      cards.push({
        variantId: v.id,
        variantSlug: v.variantSlug ?? null,
        colorLabel: r.color,
        imageUrl: pickVariantCardImageUrl(v, r.color, product, resolveMedia),
        price,
        priceLabel: price > 0 ? formatProductPriceRub(price) : '—',
      });
    }
    if (cards.length) groups.push({ materialTitle: title, cards });
  }
  return groups.length ? groups : null;
}
