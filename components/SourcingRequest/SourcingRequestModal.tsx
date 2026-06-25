'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/Button/Button';
import panelModal from '@/components/SlideInPanelModal/slideInPanelModal.module.css';
import { TextField } from '@/components/TextField';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import { SourcingAttachmentsBlock } from './SourcingAttachmentsBlock';
import { SourcingAuthGateView } from './SourcingAuthGateView';
import { SourcingProductAccordion } from './SourcingProductAccordion';
import { SourcingSuccessView } from './SourcingSuccessView';
import { SOURCING_CITY_MAX, SOURCING_MAX_PRODUCTS, SOURCING_TITLE_MAX } from './sourcingLimits';
import styles from './SourcingRequestModal.module.css';
import { useSourcingRequestForm } from './useSourcingRequestForm';
import { productsCountLabel } from './validation';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type SourcingRequestModalProps = {
  open: boolean;
  onClose: () => void;
  resumeDraft?: boolean;
  onSubmitted?: () => void;
};

export function SourcingRequestModal({
  open,
  onClose,
  resumeDraft = false,
  onSubmitted,
}: SourcingRequestModalProps) {
  const panelRef = useRef<HTMLElement>(null);
  const form = useSourcingRequestForm({ open, resumeDraft, onClose, onSubmitted });
  const {
    discardConfirmOpen,
    setDiscardConfirmOpen,
    requestClose,
    draftLoading,
    draftError,
    view,
    handleClose,
    authLoginHref,
    authRegisterHref,
    setView,
    handleSubmit,
    requestTitle,
    handleRequestTitleChange,
    deliveryCity,
    setDeliveryCity,
    products,
    addProduct,
    formErrors,
    openProductId,
    setOpenProductId,
    removeProduct,
    updateProduct,
    addReferenceImages,
    removeReferenceImage,
    formAttachments,
    addFormAttachments,
    removeFormAttachment,
    submitError,
    submitLoading,
  } = form;

  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (discardConfirmOpen) {
          setDiscardConfirmOpen(false);
          return;
        }
        requestClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, requestClose, discardConfirmOpen, setDiscardConfirmOpen]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button type="button" className={panelModal.backdrop} aria-label="Закрыть" onClick={requestClose} />
      <section
        ref={panelRef}
        className={`${panelModal.panel} ${panelModal.panelOrderWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sourcing-request-modal-title"
        tabIndex={-1}
      >
        <div className={styles.panelRoot}>
        <header className={panelModal.header}>
          <button type="button" className={panelModal.iconBtn} onClick={requestClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </header>
        <div className={`${panelModal.inner} ${styles.innerTightTop}`}>
          <h2 id="sourcing-request-modal-title" className={panelModal.title}>
            Заказать подбор
          </h2>

          {draftLoading ? (
            <p className={styles.successMessage} role="status">
              Восстанавливаем черновик заявки…
            </p>
          ) : draftError ? (
            <p className={styles.submitError} role="alert">
              {draftError}
            </p>
          ) : view === 'success' ? (
            <SourcingSuccessView onClose={handleClose} />
          ) : view === 'auth-required' ? (
            <SourcingAuthGateView
              authLoginHref={authLoginHref}
              authRegisterHref={authRegisterHref}
              onBackToForm={() => setView('form')}
            />
          ) : (
            <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
              <div className={styles.fieldRow}>
                <TextField
                  label="Название заявки"
                  id="sourcing-request-title"
                  value={requestTitle}
                  onChange={(e) => handleRequestTitleChange(e.target.value)}
                  placeholder="Например: Диваны для лобби ЖК"
                  autoComplete="off"
                  maxLength={SOURCING_TITLE_MAX}
                  error={formErrors.requestTitle}
                />
                <TextField
                  label="Город доставки"
                  id="sourcing-request-delivery-city"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  autoComplete="address-level2"
                  maxLength={SOURCING_CITY_MAX}
                />
              </div>

              <div className={styles.productsBlock}>
                <div className={styles.productsHeader}>
                  <h3 className={styles.productsTitle}>
                    Товары
                    <span className={styles.productsCount}>{productsCountLabel(products.length)}</span>
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addProduct}
                    disabled={products.length >= SOURCING_MAX_PRODUCTS}
                  >
                    Добавить товар
                  </Button>
                </div>

                {formErrors.filesGeneral ? (
                  <p className={styles.formErrorBanner} role="alert">
                    {formErrors.filesGeneral}
                  </p>
                ) : null}

                {formErrors.productsGeneral ? (
                  <p className={styles.formErrorBanner} role="alert">
                    {formErrors.productsGeneral}
                  </p>
                ) : null}

                <div className={styles.productsList}>
                  {products.map((product, index) => (
                    <SourcingProductAccordion
                      key={product.id}
                      product={product}
                      index={index}
                      open={openProductId === product.id}
                      onOpenChange={(next) => {
                        if (next) setOpenProductId(product.id);
                        else if (openProductId === product.id) setOpenProductId('');
                      }}
                      canDelete={products.length > 1}
                      onRemove={() => removeProduct(product.id)}
                      fieldErrors={formErrors.productErrors?.[product.id]}
                      onUpdate={(patch) => updateProduct(product.id, patch)}
                      onAddReferenceImages={(files) => addReferenceImages(product.id, files)}
                      onRemoveReferenceImage={(imageId) => removeReferenceImage(product.id, imageId)}
                    />
                  ))}
                </div>
              </div>

              <SourcingAttachmentsBlock
                attachments={formAttachments}
                onAdd={addFormAttachments}
                onRemove={removeFormAttachment}
              />

              {submitError ? (
                <p className={styles.submitError} role="alert">
                  {submitError}
                </p>
              ) : null}

              <div className={panelModal.actions}>
                <Button type="submit" variant="primary" disabled={submitLoading}>
                  {submitLoading ? 'Отправка…' : 'Отправить заявку'}
                </Button>
                <Button type="button" variant="secondary" onClick={requestClose}>
                  Отмена
                </Button>
              </div>
            </form>
          )}
        </div>
        {discardConfirmOpen ? (
          <div
            className={styles.discardOverlay}
            role="presentation"
            onMouseDown={(e) => e.target === e.currentTarget && setDiscardConfirmOpen(false)}
          >
            <div
              className={styles.discardDialog}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="sourcing-discard-title"
              aria-describedby="sourcing-discard-desc"
            >
              <h3 id="sourcing-discard-title" className={styles.discardTitle}>
                Закрыть заявку?
              </h3>
              <p id="sourcing-discard-desc" className={styles.discardText}>
                Введённые данные не сохранятся. Вы уверены, что хотите закрыть форму?
              </p>
              <div className={styles.discardActions}>
                <Button type="button" variant="secondary" onClick={() => setDiscardConfirmOpen(false)}>
                  Остаться
                </Button>
                <Button type="button" variant="primary" onClick={handleClose}>
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </section>
    </>
  );
}
