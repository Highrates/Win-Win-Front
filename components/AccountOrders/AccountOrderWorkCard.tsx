'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import styles from './AccountOrderWorkCard.module.css';

export type AccountOrderWorkMetaRow = { label: string; value: ReactNode; valueTitle?: string };

export type AccountOrderWorkOffer = {
  discountLabel: string;
  finalPrice: string;
  oldPrice: string;
  expectedBonus: string;
};

export type AccountOrderWorkCardProps = {
  statusLabel: string;
  dateLine: string;
  metaRows: AccountOrderWorkMetaRow[];
  productThumbSrcs: string[];
  /** Ссылка на страницу заказа, если не задан onOpenDetails */
  detailHref?: string;
  /** Открыть детали в модалке (приоритетнее detailHref) */
  onOpenDetails?: () => void;
  /** 1 или 2 кнопки с иконкой сообщения в колонке orderCTA */
  ctaCount?: 1 | 2;
  /** Блок цен и бонуса справа от меты + кнопка «Оформить» в orderCTA */
  offer?: AccountOrderWorkOffer;
};

const PLACEHOLDER = '/images/placeholder.svg';

function OrderCtaMessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5.83335 15.3582H9.16669L12.875 17.8249C13.425 18.1916 14.1667 17.7999 14.1667 17.1332V15.3582C16.6667 15.3582 18.3334 13.6916 18.3334 11.1916V6.19157C18.3334 3.69157 16.6667 2.0249 14.1667 2.0249H5.83335C3.33335 2.0249 1.66669 3.69157 1.66669 6.19157V11.1916C1.66669 13.6916 3.33335 15.3582 5.83335 15.3582Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function renderMeta(metaRows: AccountOrderWorkMetaRow[]) {
  return (
    <div className={productListStyles.productCardDetailedMeta}>
      {metaRows.map((row, index) => (
        <div key={`${row.label}-${index}`} className={productListStyles.productCardDetailedMetaItem}>
          <span className={productListStyles.productCardDetailedMetaLabel}>{row.label}</span>
          <span title={row.valueTitle}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AccountOrderWorkCard({
  statusLabel,
  dateLine,
  metaRows,
  productThumbSrcs,
  detailHref,
  onOpenDetails,
  ctaCount = 1,
  offer,
}: AccountOrderWorkCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const hasCheckout = Boolean(offer);

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

  const thumbs = productThumbSrcs.length > 0 ? productThumbSrcs : [PLACEHOLDER];

  const metaBlock = offer ? (
    <div className={styles.metaOfferRow}>
      <div className={styles.metaOfferRowMeta}>{renderMeta(metaRows)}</div>
      <div className={styles.orderOffer}>
        <div className={styles.priceDetails}>
          <span className={styles.priceDiscount}>{offer.discountLabel}</span>
          <span className={styles.priceFinal}>{offer.finalPrice}</span>
          <span className={styles.priceOld}>{offer.oldPrice}</span>
        </div>
        <div className={styles.orderOfferExpectedBonus}>
          <img
            src="/icons/wallet-add.svg"
            alt=""
            width={16}
            height={16}
            className={styles.orderOfferExpectedBonusIcon}
            aria-hidden
          />
          <span className={styles.orderOfferExpectedBonusLine}>
            <span className={styles.orderOfferExpectedBonusLabel}>Ожидаемый бонус: </span>
            <span className={styles.orderOfferExpectedBonusValue}>{offer.expectedBonus}</span>
          </span>
        </div>
      </div>
    </div>
  ) : (
    renderMeta(metaRows)
  );

  return (
    <div className={styles.orderWrapper}>
      <div className={styles.orderCard}>
        <div className={styles.orderCardTop}>
          <div className={styles.orderCardTopLeft}>
            <span className={styles.orderStatus}>{statusLabel}</span>
            <span className={styles.orderDate}>{dateLine}</span>
          </div>
          <div className={productListStyles.productCardDetailedMoreWrap} ref={menuWrapRef}>
            <button
              type="button"
              className={`${productListStyles.iconButton} ${productListStyles.productCardDetailedMoreTrigger}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Действия по заказу"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <img src="/icons/more.svg" alt="" width={20} height={20} className={productListStyles.iconBlack} />
            </button>
            {menuOpen ? (
              <div className={productListStyles.productCardDetailedMoreMenu} role="menu">
                <button type="button" className={productListStyles.productCardDetailedMoreItem} role="menuitem">
                  Архивировать
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {metaBlock}

        <div className={styles.orderProductImgs}>
          {thumbs.map((src, i) => (
            <div key={`${src}-${i}`} className={styles.orderProductImg}>
              <img src={src} alt="" width={68} height={73} loading="lazy" />
            </div>
          ))}
        </div>

        <div className={styles.orderDetailLinkRow}>
          {onOpenDetails ? (
            <button type="button" className={styles.orderDetailLink} onClick={onOpenDetails}>
              Подробнее о заказе
            </button>
          ) : detailHref ? (
            <Link href={detailHref} className={styles.orderDetailLink}>
              Подробнее о заказе
            </Link>
          ) : null}
          <img src="/icons/arrow-right.svg" alt="" width={10} height={5} className={styles.orderDetailArrow} aria-hidden />
        </div>
      </div>

      <div className={styles.orderCTA}>
        <button type="button" className={styles.ctaButton} aria-label="Написать по заказу">
          <OrderCtaMessageIcon className={styles.ctaIcon} />
        </button>
        {ctaCount === 2 && !hasCheckout ? (
          <button type="button" className={styles.ctaButton} aria-label="Сообщения по заказу">
            <OrderCtaMessageIcon className={styles.ctaIcon} />
          </button>
        ) : null}
        {hasCheckout ? (
          <button type="button" className={styles.orderCheckoutBtn}>
            <span>Оформить</span>
            <span aria-hidden>→</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
