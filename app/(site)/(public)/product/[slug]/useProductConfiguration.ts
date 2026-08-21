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
  formatPdpConfigurationHint,
  getPdpConfigurationMissingLabels,
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

  const configurationMissingLabels = useMemo(
    () =>
      getPdpConfigurationMissingLabels({
        modifications,
        modificationId,
        elements,
        selections,
      }),
    [modifications, modificationId, elements, selections],
  );

  const configurationHintMessage = useMemo(
    () => formatPdpConfigurationHint(configurationMissingLabels),
    [configurationMissingLabels],
  );

  const priceText = useMemo(
    () =>
      resolvePdpPriceText({
        modificationId: effectiveModificationId,
        matchedVariant,
        priceMin,
        priceMax,
      }),
    [effectiveModificationId, matchedVariant, priceMin, priceMax],
  );

  const galleryImages = useMemo(
    () =>
      resolvePdpGalleryImages({
        modificationId: effectiveModificationId,
        matchedVariant,
        variantImagesMap,
        productImages,
      }),
    [effectiveModificationId, matchedVariant, variantImagesMap, productImages],
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
    // Единственную модификацию нельзя снять — она всегда активна.
    if (modifications.length === 1) {
      setModificationId(id);
      return;
    }
    setModificationId((cur) => (cur === id ? null : id));
  }

  return {
    modificationId,
    selections,
    effectiveModificationId,
    matchedVariant,
    configurationReadyForProject,
    configurationMissingLabels,
    configurationHintMessage,
    priceText,
    galleryImages,
    toggleSelection,
    toggleModification,
  };
}
