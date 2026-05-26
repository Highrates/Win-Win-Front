'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { PRODUCT_CARD_PLACEHOLDER, productCardImageOnError } from '@/lib/productCardImageUrls';
import productListStyles from './AccountProductList.module.css';

export type AccountDetailedProductMetaRow = { label: string; value: string };

export type AccountDetailedProductLine = {
  id: string;
  name: string;
  price: string;
  metaRows: AccountDetailedProductMetaRow[];
};

type AccountDetailedProductRowProps = {
  product: AccountDetailedProductLine;
  selectionMode: boolean;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  imageSrc?: string;
  /** Ссылка с названия товара (напр. на PDP с returnTo). */
  nameHref?: string | null;
  /** Путь на PDP для меню «⋯» и копирования ссылки. */
  productPagePath?: string | null;
  onRemoveFromProject?: () => void;
  /** Подпись пункта меню удаления (по умолчанию — для проектов). */
  removeMenuItemText?: string;
  quantity?: number;
  unit?: string;
  onQuantityDelta?: (delta: number) => void;
  /** Дополнительный блок под метой (напр. выбор помещения в модалке проекта). */
  footerExtra?: ReactNode;
};

const PLACEHOLDER = PRODUCT_CARD_PLACEHOLDER;

export function AccountDetailedProductRow({
  product,
  selectionMode,
  selected,
  onSelectedChange,
  imageSrc = PLACEHOLDER,
  nameHref,
  productPagePath,
  onRemoveFromProject,
  removeMenuItemText = 'Удалить из проекта',
  quantity = 1,
  unit = 'шт',
  onQuantityDelta,
  footerExtra,
}: AccountDetailedProductRowProps) {
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = menuWrapRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const nameEl = nameHref ? (
    <Link href={nameHref} className={productListStyles.productCardDetailedName}>
      {product.name}
    </Link>
  ) : (
    <span className={productListStyles.productCardDetailedName}>{product.name}</span>
  );

  async function copyProductLink() {
    if (!productPagePath || typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${productPagePath}`);
    } catch {
      /* ignore */
    }
    setMenuOpen(false);
  }

  return (
    <div className={productListStyles.productCardDetailedRow}>
      {selectionMode ? (
        <input
          type="checkbox"
          className={productListStyles.productCardCheckbox}
          checked={selected}
          onChange={(e) => onSelectedChange(e.target.checked)}
          aria-label={`Выбрать «${product.name}»`}
        />
      ) : null}
      <div className={productListStyles.productCardDetailed}>
        <div className={productListStyles.productCardDetailedImageWrap}>
          <img
            src={imageSrc}
            alt={product.name}
            className={productListStyles.productCardDetailedImage}
            loading="lazy"
            decoding="async"
            onError={productCardImageOnError}
          />
        </div>
        <div className={productListStyles.productCardDetailedBody}>
          <div className={productListStyles.productCardDetailedTitleRow}>
            <div className={productListStyles.productCardDetailedTitleTexts}>
              {nameEl}
              <span className={productListStyles.productCardDetailedPrice}>{product.price}</span>
            </div>
            <div ref={menuWrapRef} className={productListStyles.productCardDetailedMoreWrap}>
              <button
                type="button"
                className={`${productListStyles.iconButton} ${productListStyles.productCardDetailedMoreTrigger}`}
                aria-label={`Ещё по товару: ${product.name}`}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <img src="/icons/more.svg" alt="" width={20} height={20} aria-hidden />
              </button>
              {menuOpen ? (
                <div className={productListStyles.productCardDetailedMoreMenu} role="menu">
                  {productPagePath ? (
                    <Link
                      href={productPagePath}
                      className={productListStyles.productCardDetailedMoreItem}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Открыть товар
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    className={productListStyles.productCardDetailedMoreItem}
                    onClick={() => void copyProductLink()}
                    disabled={!productPagePath}
                  >
                    Скопировать ссылку
                  </button>
                  {onRemoveFromProject ? (
                    <button
                      type="button"
                      role="menuitem"
                      className={`${productListStyles.productCardDetailedMoreItem} ${productListStyles.productCardDetailedMoreItemDanger}`}
                      onClick={() => {
                        setMenuOpen(false);
                        onRemoveFromProject();
                      }}
                    >
                      {removeMenuItemText}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className={productListStyles.productCardDetailedMeta}>
            {product.metaRows.map((row, index) => (
              <div key={`${product.id}-meta-${index}`} className={productListStyles.productCardDetailedMetaItem}>
                <span className={productListStyles.productCardDetailedMetaLabel}>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
          {footerExtra ? <div className={productListStyles.productCardDetailedFooterExtra}>{footerExtra}</div> : null}
          <div className={productListStyles.productCardDetailedFooter}>
            <div className={productListStyles.productCardDetailedQty}>
              <button
                type="button"
                className={productListStyles.qtyButton}
                aria-label="Уменьшить количество"
                disabled={!onQuantityDelta}
                onClick={() => onQuantityDelta?.(-1)}
              >
                -
              </button>
              <span className={productListStyles.qtyValue}>
                {qty}
                {'\u00A0'}
                {unit || 'шт'}
              </span>
              <button
                type="button"
                className={productListStyles.qtyButton}
                aria-label="Увеличить количество"
                disabled={!onQuantityDelta}
                onClick={() => onQuantityDelta?.(1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
