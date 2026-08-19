'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
import { ProductPdpLoginModal } from './ProductPdpLoginModal';
import { ProductPdpPurchaseBlock } from './ProductPdpPurchaseBlock';
import { ProductPageLeftColumn } from './ProductPageLeftColumn';
import { ProductQaChatPanel } from '@/components/ProductQa/ProductQaChatPanel';
import { useProductQaRealtime } from '@/hooks/useProductQaRealtime';
import { useProductConfiguration } from './useProductConfiguration';
import { useProductPdpActions } from './useProductPdpActions';
import { PRODUCT_QA_SECTION_ID } from '@/lib/productQa/constants';
import { invalidateUserClientCaches } from '@/lib/userSessionClient';
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
  productTitleText: string;
  productImages: string[];
  variantImagesMap: Record<string, string[]>;
  socialProps: {
    productId: string;
    casesLinkedCount: number;
    likesDisplayCount: number;
  };
  initialQaMessageCount: number;
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
    productTitleText,
    productImages,
    variantImagesMap,
    socialProps,
    initialQaMessageCount,
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

  const [qaMessageCount, setQaMessageCount] = useState(initialQaMessageCount);
  const [qaChatOpen, setQaChatOpen] = useState(false);

  const openProductQa = () => {
    setQaChatOpen(true);
  };

  useEffect(() => {
    setQaMessageCount(initialQaMessageCount);
  }, [initialQaMessageCount]);

  useProductQaRealtime(
    { productSlug },
    {
      enabled: Boolean(productSlug),
      onMetaUpdated: (meta) => setQaMessageCount(meta.messageCount),
    },
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const openFromHash = () => {
      if (window.location.hash === `#${PRODUCT_QA_SECTION_ID}`) {
        openProductQa();
      }
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  const {
    modificationId,
    selections,
    effectiveModificationId,
    matchedVariant,
    configurationReadyForProject,
    configurationHintMessage,
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
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const pendingAfterLoginRef = useRef<(() => void) | null>(null);
  const loginReturnPath = `/product/${productSlug}`;

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
    onLoginRequired: (retry) => {
      pendingAfterLoginRef.current = retry;
      setLoginModalOpen(true);
    },
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
    configurationHintMessage,
    onConfigurationHint: () => {
      if (configurationHintMessage) pushError(configurationHintMessage);
    },
    projects: pdpActions.designerProjects,
    projectsLoading: pdpActions.designerProjectsLoading,
    projectActionBusy: pdpActions.projectLineSaving,
    orderActionBusy: pdpActions.orderLineSaving,
    onAddToExistingProject: pdpActions.handleAddToExistingProject,
    onCreateNewProject: pdpActions.handleCreateNewProject,
    onAddToOrder: pdpActions.handleAddToOrder,
    orderQuantity: pdpActions.orderQuantity,
    onOrderQuantityDelta: pdpActions.handleOrderQuantityDelta,
    onMenuOpenChange: (open: boolean) => {
      if (open) pdpActions.ensureProjectsLoaded();
    },
  };

  const qaChatTitle = productTitleText;

  return (
    <>
      <span id={PRODUCT_QA_SECTION_ID} className={styles.productQaHashAnchor} aria-hidden />
      <FlashBanner flash={flash} onDismiss={dismiss} />
      <div className={styles.productImgsWrapper}>
        <ProductGallery images={galleryImages} productName={productName} />
      </div>

      <div className={styles.productDetails}>
        <ProductPageLeftColumn
          productId={socialProps.productId}
          productTitleText={productTitleText}
          casesLinkedCount={socialProps.casesLinkedCount}
          likesDisplayCount={socialProps.likesDisplayCount}
          qaMessageCount={qaMessageCount}
          onQaClick={openProductQa}
          brand={brand ? { name: brand.name, href: brand.href } : null}
        />
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

      <ProductQaChatPanel
        presentation="overlay"
        chatOpen={qaChatOpen}
        onChatClose={() => setQaChatOpen(false)}
        enabled={qaChatOpen}
        productSlug={productSlug}
        productVariantId={matchedVariant?.id ?? selectedVariantId ?? defaultVariantId}
        initialMessageCount={qaMessageCount}
        onMessageCountChange={setQaMessageCount}
        idPrefix="product-qa"
        loginReturnPath={`/product/${productSlug}#${PRODUCT_QA_SECTION_ID}`}
        postToCorrespondence
        chatTitle={qaChatTitle}
      />

      <ProductCreateProjectModalGate
        open={pdpActions.createProjectModalOpen}
        pendingLineDraft={pdpActions.pendingLineDraftForModal}
        onClose={pdpActions.closeProjectModal}
        onSaveError={pushError}
        onSaved={pdpActions.handleProjectModalSaved}
      />

      <ProductPdpLoginModal
        open={loginModalOpen}
        callbackUrl={loginReturnPath}
        onClose={() => {
          setLoginModalOpen(false);
          pendingAfterLoginRef.current = null;
        }}
        onAuthenticated={() => {
          invalidateUserClientCaches({ authenticated: true });
          setLoginModalOpen(false);
          const retry = pendingAfterLoginRef.current;
          pendingAfterLoginRef.current = null;
          retry?.();
        }}
      />
    </>
  );
}
