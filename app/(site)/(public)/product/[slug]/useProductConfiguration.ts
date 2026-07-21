'use client';

import { useMemo, useState } from 'react';
import type {
  PublicProductElementApi,
  PublicProductModificationApi,
  PublicProductVariantApi,
} from '@/lib/publicProductFromApi';
import {
  buildInitialSelections,
  findExactVariant,
  getSoleModificationId,
  isConfigurationReadyForProject,
  resolvePdpGalleryImages,
  resolvePdpPriceText,
} from '@/lib/product/variantMatch';

type Params = {
  modifications: PublicProductModificationApi[];
  elements: PublicProductElementApi[];
  variants: PublicProductVariantApi[];
  initialModificationId: string | null;
  selectedVariantId: string | null;
  defaultVariantId: string | null;
  productImages: string[];
  variantImagesMap: Record<string, string[]>;
  priceMin: number;
  priceMax: number;
};

export function useProductConfiguration({
  modifications,
  elements,
  variants,
  initialModificationId,
  selectedVariantId,
  defaultVariantId,
  productImages,
  variantImagesMap,
  priceMin,
  priceMax,
}: Params) {
  const [modificationId, setModificationId] = useState<string | null>(initialModificationId);
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    buildInitialSelections(elements, variants, selectedVariantId ?? defaultVariantId),
  );

  const effectiveModificationId = modificationId ?? getSoleModificationId(modifications);

  const matchedVariant = useMemo(
    () => findExactVariant(variants, elements, effectiveModificationId, selections),
    [variants, elements, effectiveModificationId, selections],
  );

  const configurationReadyForProject = useMemo(
    () => isConfigurationReadyForProject(elements, effectiveModificationId, selections),
    [elements, effectiveModificationId, selections],
  );

  const priceText = useMemo(
    () =>
      resolvePdpPriceText({
        modificationId,
        matchedVariant,
        priceMin,
        priceMax,
      }),
    [modificationId, matchedVariant, priceMin, priceMax],
  );

  const galleryImages = useMemo(
    () =>
      resolvePdpGalleryImages({
        modificationId,
        matchedVariant,
        variantImagesMap,
        productImages,
      }),
    [modificationId, matchedVariant, variantImagesMap, productImages],
  );

  function toggleSelection(elementId: string, brandMaterialColorId: string) {
    setSelections((prev) => {
      if (prev[elementId] === brandMaterialColorId) {
        const next = { ...prev };
        delete next[elementId];
        return next;
      }
      return { ...prev, [elementId]: brandMaterialColorId };
    });
  }

  function toggleModification(id: string) {
    setModificationId((cur) => (cur === id ? null : id));
  }

  return {
    modificationId,
    selections,
    effectiveModificationId,
    matchedVariant,
    configurationReadyForProject,
    priceText,
    galleryImages,
    toggleSelection,
    toggleModification,
  };
}
