/** Ответ `GET catalog/admin/products/:productId/variants/:variantId` (фрагмент). */
export type AdminVariantForKpSnapshot = {
  productName: string;
  variantLabel: string | null;
  modificationId: string;
  modificationsForProduct: { id: string; name: string }[];
  productElements: {
    id: string;
    name: string;
    sortOrder: number;
    availableMaterialColors: {
      brandMaterialColorId: string;
      materialName: string;
      colorName: string;
    }[];
  }[];
  selections: { productElementId: string; brandMaterialColorId: string }[];
  productGalleryImages: { id: string; url: string; sortOrder?: number }[];
  galleryProductImageIds: string[];
  price: string;
};

export function buildSnapshotFromAdminVariant(v: AdminVariantForKpSnapshot): Record<string, unknown> {
  const mod = v.modificationsForProduct.find((m) => m.id === v.modificationId);
  const modificationLabel = mod?.name?.trim() || v.variantLabel?.trim() || null;

  const elementMaterialRows: { elementLabel: string; materialColorLabel: string }[] = [];
  const sortedEls = [...v.productElements].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const el of sortedEls) {
    if (el.availableMaterialColors.length === 0) continue;
    const sel = v.selections.find((s) => s.productElementId === el.id);
    const av = sel
      ? el.availableMaterialColors.find((c) => c.brandMaterialColorId === sel.brandMaterialColorId)
      : undefined;
    const materialColorLabel = av
      ? `${av.materialName.trim()} — ${av.colorName.trim()}`.trim()
      : '—';
    elementMaterialRows.push({
      elementLabel: el.name.trim() || 'Элемент',
      materialColorLabel,
    });
  }

  const idSet = new Set(v.galleryProductImageIds);
  const fromVariant = v.productGalleryImages.find((img) => idSet.has(img.id));
  const imageUrl =
    (fromVariant?.url || v.productGalleryImages[0]?.url || '').trim() || undefined;

  const priceNum = parseFloat(v.price.replace(',', '.'));
  const catalogPriceMinRub =
    Number.isFinite(priceNum) && priceNum > 0 ? priceNum : undefined;

  const snap: Record<string, unknown> = {
    productName: v.productName.trim() || 'Товар',
    modificationLabel: modificationLabel ?? undefined,
    elementMaterialRows,
    imageUrl,
  };
  if (catalogPriceMinRub != null) {
    snap.catalogPriceMinRub = catalogPriceMinRub;
    snap.catalogPriceMaxRub = catalogPriceMinRub;
  }
  return snap;
}
