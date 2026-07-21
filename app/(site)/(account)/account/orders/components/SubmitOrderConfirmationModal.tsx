'use client';

import { useEffect, useMemo } from 'react';
import { AccountDetailedProductRow } from '@/components/AccountProductList/AccountDetailedProductRow';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import { Button } from '@/components/Button';
import modalStyles from '@/app/(site)/(account)/account/projects/components/CreateEditProjectModal.module.css';
import { mapOrderLineToAccountProduct } from '@/lib/orderPreparation/mapLineToAccountProduct';
import type { OrderPreparationLineApi } from '@/lib/orderPreparation/types';
import ownStyles from './SubmitOrderConfirmationModal.module.css';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M15 5L5 15M5 5l10 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading: boolean;
  /** Сумма количеств по выбранным строкам (не число SKU). */
  selectedUnitsTotal: number;
  totalLabel: string;
  previewLines: OrderPreparationLineApi[];
  /** Текст из поля «Комментарий к заказу» (показываем в модалке и уходит в чат при отправке). */
  orderComment: string;
};

const noopSelected = () => {};

export function SubmitOrderConfirmationModal({
  open,
  onClose,
  onConfirm,
  loading,
  selectedUnitsTotal,
  totalLabel,
  previewLines,
  orderComment,
}: Props) {
  const previewProducts = useMemo(
    () => previewLines.map((line) => ({ line, product: mapOrderLineToAccountProduct(line) })),
    [previewLines],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const body = document.body;
    const ph = html.style.overflow;
    const pb = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = ph;
      body.style.overflow = pb;
    };
  }, [open, onClose]);

  if (!open) return null;

  const lineCount = previewLines.length;
  const commentTrim = orderComment.trim();

  return (
    <div
      className={modalStyles.overlay}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className={modalStyles.panel} role="dialog" aria-modal="true" aria-labelledby="submit-order-title">
        <div className={modalStyles.panelHead}>
          <h2 id="submit-order-title" className={modalStyles.panelTitle}>
            Подтвердите заказ
          </h2>
          <button type="button" className={modalStyles.closeBtn} onClick={onClose} disabled={loading} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>
        <div className={modalStyles.body}>
          <p className={ownStyles.introBody}>
            Заказ будет передан менеджеру. Проверьте состав и детали доставки. Вы выбрали:{' '}
            <strong>{selectedUnitsTotal}</strong>
            {'\u00A0'}
            шт.
          </p>
          <p className={ownStyles.priceRow}>{totalLabel}</p>
          {commentTrim ? (
            <div className={ownStyles.commentBlock}>
              <div className={ownStyles.commentLabel}>Комментарий к заказу</div>
              <p className={ownStyles.commentText}>{commentTrim}</p>
            </div>
          ) : null}

          <div className={`${productListStyles.productCardDetailedWrapper} ${ownStyles.linesWrap}`}>
            {previewProducts.map(({ line, product }) => (
              <AccountDetailedProductRow
                key={line.id}
                product={product}
                selectionMode={false}
                selected={false}
                onSelectedChange={noopSelected}
                imageSrc={line.imageUrl ?? undefined}
                nameHref={line.productSlug ? `/product/${line.productSlug}` : null}
                productPagePath={line.productSlug ? `/product/${line.productSlug}` : null}
                quantity={line.quantity}
                unit={line.unit ?? 'шт'}
              />
            ))}
          </div>
        </div>
        <div className={modalStyles.panelFooter}>
          <Button type="button" variant="secondary" className={ownStyles.footerBtn} onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            type="button"
            variant="primary"
            className={ownStyles.footerBtn}
            disabled={loading || lineCount < 1}
            onClick={() => void onConfirm()}
          >
            {loading ? 'Отправка…' : 'Отправить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
