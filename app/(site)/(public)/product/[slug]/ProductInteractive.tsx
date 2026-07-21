'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { ProductGallery } from '@/components/ProductGallery';
import type {
  PublicProductElementApi,
  PublicProductModificationApi,
  PublicProductVariantApi,
} from '@/lib/publicProductFromApi';
import ProductAccordions from './ProductAccordions';
import { FlashBanner } from '@/components/FlashBanner/FlashBanner';
import { useFlashBanner } from '@/hooks/useFlashBanner';
import ProductElementTabs from './ProductElementTabs';
import ProductModifications from './ProductModifications';
import { ProductCreateProjectModalGate } from './ProductCreateProjectModalLazy';
import { ProductPdpPurchaseBlock } from './ProductPdpPurchaseBlock';
import { useProductConfiguration } from './useProductConfiguration';
import { useProductPdpActions } from './useProductPdpActions';
import styles from './ProductInteractive.module.css';
import purchaseStyles from './ProductPdpPurchaseBlock.module.css';
import btnStyles from '@/components/Button/Button.module.css';

type BrandInfo = {
  name: string;
  href: string;
  shortDescription: string | null;
  logoUrl: string | null;
};

type Props = {
  productId: string;
  productSlug: string;
  productName: string;
  productImages: string[];
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

export default function ProductInteractive(props: Props) {
  const {
    productId,
    productSlug,
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

  const {
    modificationId,
    selections,
    effectiveModificationId,
    matchedVariant,
    configurationReadyForProject,
    priceText,
    galleryImages,
    toggleSelection,
    toggleModification,
  } = useProductConfiguration({
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
  });

  const { flash, pushError, dismiss } = useFlashBanner();
  const [projectAddedMessage, setProjectAddedMessage] = useState<string | null>(null);
  const [orderAddedMessage, setOrderAddedMessage] = useState<string | null>(null);

  const pdpActions = useProductPdpActions({
    productId,
    productSlug,
    productName,
    modifications,
    elements,
    effectiveModificationId,
    selections,
    matchedVariant,
    configurationReadyForProject,
    galleryImages,
    priceMin,
    priceMax,
    pushError,
    onOrderAdded: () => setOrderAddedMessage('Товар добавлен в заказ'),
    onProjectAdded: (label) => setProjectAddedMessage(`Товар добавлен в проект: ${label}`),
  });

  useEffect(() => {
    if (!projectAddedMessage) return;
    const timer = window.setTimeout(() => setProjectAddedMessage(null), 7000);
    return () => window.clearTimeout(timer);
  }, [projectAddedMessage]);

  useEffect(() => {
    if (!orderAddedMessage) return;
    const timer = window.setTimeout(() => setOrderAddedMessage(null), 7000);
    return () => window.clearTimeout(timer);
  }, [orderAddedMessage]);

  const orderSplitProps = {
    configurationReadyForProject,
    projects: pdpActions.designerProjects,
    projectsLoading: pdpActions.designerProjectsLoading,
    projectActionBusy: pdpActions.projectLineSaving,
    orderActionBusy: pdpActions.orderLineSaving,
    onAddToExistingProject: pdpActions.handleAddToExistingProject,
    onCreateNewProject: pdpActions.handleCreateNewProject,
    onAddToOrder: pdpActions.handleAddToOrder,
    onMenuOpenChange: (open: boolean) => {
      if (open) pdpActions.ensureProjectsLoaded();
    },
  };

  return (
    <>
      <FlashBanner flash={flash} onDismiss={dismiss} />
      <div className={styles.productImgsWrapper}>
        <ProductGallery images={galleryImages} productName={productName} />
      </div>

      <div className={styles.productDetails}>
        {leftColumn}
        <div className={styles.productDetailsRight}>
          {projectAddedMessage ? (
            <div className={styles.pdpBannerRow}>
              <div className={styles.pdpProjectAddedBanner} role="status">
                <span className={styles.pdpProjectAddedBannerText}>{projectAddedMessage}</span>
                <button
                  type="button"
                  className={styles.pdpProjectAddedBannerDismiss}
                  onClick={() => setProjectAddedMessage(null)}
                  aria-label="Закрыть уведомление"
                >
                  ×
                </button>
              </div>
              <Link
                href="/account/projects"
                className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${styles.pdpBannerLink}`}
              >
                К проектам
              </Link>
            </div>
          ) : null}
          {orderAddedMessage ? (
            <div className={styles.pdpBannerRow}>
              <div className={styles.pdpProjectAddedBanner} role="status">
                <span className={styles.pdpProjectAddedBannerText}>{orderAddedMessage}</span>
                <button
                  type="button"
                  className={styles.pdpProjectAddedBannerDismiss}
                  onClick={() => setOrderAddedMessage(null)}
                  aria-label="Закрыть уведомление"
                >
                  ×
                </button>
              </div>
              <Link
                href="/account/orders"
                className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${styles.pdpBannerLink}`}
              >
                К заказам
              </Link>
            </div>
          ) : null}

          <ProductPdpPurchaseBlock
            priceText={priceText}
            orderSplitProps={orderSplitProps}
            secondaryActions={
              <div className={purchaseStyles.btnsSecondary}>
                <Button
                  variant="secondary"
                  className={purchaseStyles.btnSecondarySegment}
                  iconLeft="/icons/ruler&pen.svg"
                  aria-label="Скачать чертеж"
                />
                <div className={purchaseStyles.btnsSecondaryDivider} aria-hidden />
                <Button
                  variant="secondary"
                  className={purchaseStyles.btnSecondarySegment}
                  iconLeft="/icons/3dcube.svg"
                  aria-label="Скачать 3D модель"
                />
              </div>
            }
          />

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
            onSelect={toggleModification}
          />

          <ProductElementTabs
            elements={elements}
            selections={selections}
            onSelect={toggleSelection}
          />

          <ProductAccordions
            deliveryText={deliveryText}
            technicalSpecs={technicalSpecs}
            additionalInfoHtml={additionalInfoHtml}
          />

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

      <ProductCreateProjectModalGate
        open={pdpActions.createProjectModalOpen}
        pendingLineDraft={pdpActions.pendingLineDraftForModal}
        onClose={pdpActions.closeProjectModal}
        onSaveError={pushError}
        onSaved={pdpActions.handleProjectModalSaved}
      />
    </>
  );
}
