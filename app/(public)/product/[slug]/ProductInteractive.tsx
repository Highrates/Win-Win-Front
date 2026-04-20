'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { ProductGallery } from '@/components/ProductGallery';
import {
  formatProductPriceRangeRub,
  formatProductPriceRub,
  parseProductPriceFromApi,
} from '@/lib/productSpecsFromApi';
import type {
  PublicProductElementApi,
  PublicProductModificationApi,
  PublicProductVariantApi,
} from '@/lib/publicProductFromApi';
import ProductAccordions from './ProductAccordions';
import { ProductDetailsStickyBar } from './ProductDetailsStickyBar';
import ProductElementTabs from './ProductElementTabs';
import ProductModifications from './ProductModifications';
import styles from './ProductPage.module.css';

type BrandInfo = {
  name: string;
  href: string;
  shortDescription: string | null;
  logoUrl: string | null;
};

type Props = {
  productName: string;
  /** Пре-резолвнутые картинки товара (fallback для галереи). */
  productImages: string[];
  /** Пре-резолвнутые картинки по вариантам (variantId → URL[]). */
  variantImagesMap: Record<string, string[]>;
  leftColumn: ReactNode;
  modifications: PublicProductModificationApi[];
  elements: PublicProductElementApi[];
  variants: PublicProductVariantApi[];
  initialModificationId: string | null;
  selectedVariantId: string | null;
  defaultVariantId: string | null;
  priceMin: number;
  priceMax: number;
  bodyText: string;
  deliveryText: string | null;
  technicalSpecs: string | null;
  additionalInfoHtml: string | null;
  brand: BrandInfo | null;
};

function buildInitialSelections(
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
function findExactVariant(
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

export default function ProductInteractive(props: Props) {
  const {
    productName,
    productImages,
    variantImagesMap,
    leftColumn,
    modifications,
    elements,
    variants,
    initialModificationId,
    selectedVariantId,
    defaultVariantId,
    priceMin,
    priceMax,
    bodyText,
    deliveryText,
    technicalSpecs,
    additionalInfoHtml,
    brand,
  } = props;

  const [modificationId, setModificationId] = useState<string | null>(initialModificationId);
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    buildInitialSelections(elements, variants, selectedVariantId ?? defaultVariantId),
  );

  const matchedVariant = useMemo(
    () => findExactVariant(variants, elements, modificationId, selections),
    [variants, elements, modificationId, selections],
  );

  const priceText = useMemo(() => {
    if (matchedVariant) {
      const n = parseProductPriceFromApi(matchedVariant.price);
      if (n > 0) return formatProductPriceRub(n);
    }
    if (priceMin > 0 && priceMax > 0 && priceMax > priceMin) {
      return formatProductPriceRangeRub(priceMin, priceMax);
    }
    if (priceMin > 0) return formatProductPriceRub(priceMin);
    return '—';
  }, [matchedVariant, priceMin, priceMax]);

  const galleryImages = useMemo(() => {
    if (matchedVariant) {
      const imgs = variantImagesMap[matchedVariant.id];
      if (imgs && imgs.length > 0) return imgs;
    }
    return productImages;
  }, [matchedVariant, variantImagesMap, productImages]);

  function handleSelect(elementId: string, brandMaterialColorId: string) {
    setSelections((prev) => ({ ...prev, [elementId]: brandMaterialColorId }));
  }

  return (
    <>
      <div className={styles.productImgsWrapper}>
        <ProductGallery images={galleryImages} productName={productName} />
      </div>

      <div className={styles.productDetails}>
        {leftColumn}
        <div className={styles.productDetailsRight}>
          <div className={styles.productDetailsRightRow}>
            <span className={styles.productDetailsPrice}>{priceText}</span>
            <div className={styles.productDetailsBtnsWrapper}>
              <div className={styles.productDetailsBtnsSecondary}>
                <Button
                  variant="secondary"
                  iconLeft="/icons/ruler&pen.svg"
                  iconRightChevron
                  aria-label="Скачать чертеж"
                />
                <Button
                  variant="secondary"
                  iconLeft="/icons/3dcube.svg"
                  iconRightChevron
                  aria-label="Скачать 3D модель"
                />
              </div>
              <Button variant="primary" className={styles.productDetailsBtnPrimary}>
                Добавить к заказу
              </Button>
            </div>
          </div>
          <ProductDetailsStickyBar priceText={priceText} />

          <div className={styles.descriptionWrapper}>
            <p className={styles.descriptionText}>{bodyText}</p>
          </div>

          <ProductModifications
            modifications={modifications.map((m) => ({
              id: m.id,
              name: m.name,
              modificationSlug: m.modificationSlug,
            }))}
            selectedModificationId={modificationId}
            onSelect={(id) => setModificationId(id)}
          />

          <ProductElementTabs
            elements={elements}
            selections={selections}
            onSelect={handleSelect}
          />

          <div className={styles.accordionsWrapper}>
            <ProductAccordions
              deliveryText={deliveryText}
              technicalSpecs={technicalSpecs}
              additionalInfoHtml={additionalInfoHtml}
            />
          </div>

          {brand ? (
            <div className={styles.brandWrapper}>
              <h2 className={styles.brandTitle}>Бренд</h2>
              <Link
                href={brand.href}
                className={styles.brandContent}
                aria-label={`Перейти на страницу бренда ${brand.name}`}
              >
                <div className={styles.brandContentInner}>
                  <div
                    className={styles.brandLogo}
                    style={
                      brand.logoUrl
                        ? {
                            backgroundImage: `url(${brand.logoUrl})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                    aria-hidden
                  />
                  <div className={styles.brandShortDescription}>
                    <span className={styles.brandName}>{brand.name}</span>
                    <p className={styles.brandDescription}>
                      {brand.shortDescription ||
                        'Продукция бренда представлена в нашем каталоге.'}
                    </p>
                  </div>
                </div>
                <img
                  src="/icons/arrow.svg"
                  alt=""
                  width={22}
                  height={22}
                  className={styles.brandArrow}
                  aria-hidden
                />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
