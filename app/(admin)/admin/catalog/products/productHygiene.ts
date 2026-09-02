export const PRODUCT_ADMIN_HYGIENE_KEYS = [
  'no_modifications',
  'no_variants',
  'active_empty',
  'element_empty_pool',
  'composite_incomplete',
] as const;

export type ProductAdminHygieneKey = (typeof PRODUCT_ADMIN_HYGIENE_KEYS)[number];

export function parseProductAdminHygiene(raw: string | null | undefined): ProductAdminHygieneKey | '' {
  const v = raw?.trim().toLowerCase() ?? '';
  if (!v) return '';
  return (PRODUCT_ADMIN_HYGIENE_KEYS as readonly string[]).includes(v)
    ? (v as ProductAdminHygieneKey)
    : '';
}

export function productHygieneChipLabel(
  key: ProductAdminHygieneKey,
  labels: {
    noMods: string;
    noVariants: string;
    activeEmpty: string;
    elementEmptyPool: string;
    compositeIncomplete: string;
  },
): string {
  switch (key) {
    case 'no_modifications':
      return labels.noMods;
    case 'no_variants':
      return labels.noVariants;
    case 'active_empty':
      return labels.activeEmpty;
    case 'element_empty_pool':
      return labels.elementEmptyPool;
    case 'composite_incomplete':
      return labels.compositeIncomplete;
  }
}
