'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useToggleLike } from '@/hooks/useToggleLike';
import {
  normalizeProductCardImageUrls,
  productCardImageOnError,
} from '@/lib/productCardImageUrls';
import styles from './ProductCardSmall.module.css';

export interface ProductCardSmallProps {
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  /** Как у `ProductCard`: при непустом списке превью — первый кадр из галереи. */
  imageUrls?: string[];
  productId?: string;
  collections?: number;
  likes?: number;
  comments?: number;
  /** Режим выбора в модалке: без перехода по ссылке, подсветка выбранного. */
  pickMode?: boolean;
  selected?: boolean;
  onPickToggle?: () => void;
  heartActive?: boolean;
  likesInteractive?: boolean;
}

function formatPrice(value: number): string {
  const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `~${formatted} ₽`;
}

export function ProductCardSmall({
  slug,
  name,
  price,
  imageUrl,
  imageUrls,
  productId,
  collections = 0,
  likes = 0,
  comments = 180,
  pickMode,
  selected,
  onPickToggle,
  heartActive,
  likesInteractive = true,
}: ProductCardSmallProps) {
  const primarySrc = normalizeProductCardImageUrls(imageUrl, imageUrls)[0];
  const productHref = `/product/${encodeURIComponent(slug)}`;
  const projectsCollectionsHref =
    productId && collections > 0
      ? `/projects?product=${encodeURIComponent(productId)}`
      : null;

  const heartFilledControlled = heartActive !== undefined;
  const likeInteractive = !pickMode && !!(productId && likesInteractive && !heartFilledControlled);
  const like = useToggleLike({
    kind: 'product',
    id: productId,
    likesDisplayCount: likes,
    enabled: likeInteractive,
    mode: 'uncontrolled',
  });

  const heartFilled = heartFilledControlled ? !!heartActive : like.liked;

  const showLikesColumn = pickMode || like.auth === true;

  let heartBlock: ReactNode = null;
  if (showLikesColumn) {
    if (pickMode || heartFilledControlled || !productId || !likesInteractive) {
      heartBlock = (
        <div className={styles.interactItem}>
          {heartFilled ? (
            <svg
              className={styles.heartIconActive}
              width={20}
              height={20}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M10.5167 17.3416C10.2334 17.4416 9.76669 17.4416 9.48335 17.3416C7.06669 16.5166 1.66669 13.0749 1.66669 7.24159C1.66669 4.66659 3.74169 2.58325 6.30002 2.58325C7.81669 2.58325 9.15835 3.31659 10 4.44992C10.8417 3.31659 12.1917 2.58325 13.7 2.58325C16.2584 2.58325 18.3334 4.66659 18.3334 7.24159C18.3334 13.0749 12.9334 16.5166 10.5167 17.3416Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.interactIcon} />
          )}
          <span className={styles.interactValue}>{Math.max(0, like.count)}</span>
        </div>
      );
    } else {
      heartBlock = (
        <button
          type="button"
          className={styles.interactItem}
          disabled={like.busy || !like.interactiveReady}
          aria-label={heartFilled ? 'Убрать лайк' : 'Поставить лайк'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void like.toggle();
          }}
        >
          {heartFilled ? (
            <svg
              className={styles.heartIconActive}
              width={20}
              height={20}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M10.5167 17.3416C10.2334 17.4416 9.76669 17.4416 9.48335 17.3416C7.06669 16.5166 1.66669 13.0749 1.66669 7.24159C1.66669 4.66659 3.74169 2.58325 6.30002 2.58325C7.81669 2.58325 9.15835 3.31659 10 4.44992C10.8417 3.31659 12.1917 2.58325 13.7 2.58325C16.2584 2.58325 18.3334 4.66659 18.3334 7.24159C18.3334 13.0749 12.9334 16.5166 10.5167 17.3416Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <img src="/icons/heart.svg" alt="" width={20} height={20} className={styles.interactIcon} />
          )}
          <span className={styles.interactValue}>{Math.max(0, like.count)}</span>
        </button>
      );
    }
  }

  const interact = (
    <div className={styles.productInteract}>
      <div className={styles.interactWrapper}>
        {projectsCollectionsHref ? (
          <Link
            href={projectsCollectionsHref}
            className={`${styles.interactItem} ${styles.interactItemLink}`}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
          >
            <img
              src="/icons/collections.svg"
              alt=""
              width={20}
              height={20}
              className={styles.interactIcon}
            />
            <span className={styles.interactValue}>{collections}</span>
          </Link>
        ) : (
          <div className={styles.interactItem}>
            <img
              src="/icons/collections.svg"
              alt=""
              width={20}
              height={20}
              className={styles.interactIcon}
            />
            <span className={styles.interactValue}>{collections}</span>
          </div>
        )}
        {heartBlock}
        <div className={styles.interactItem}>
          <img src="/icons/message.svg" alt="" width={20} height={20} className={styles.interactIcon} />
          <span className={styles.interactValue}>{comments}</span>
        </div>
      </div>
    </div>
  );

  if (pickMode) {
    return (
      <button
        type="button"
        className={`${styles.productCardSmall} ${styles.productCardPick} ${selected ? styles.productCardPickSelected : ''}`}
        onClick={onPickToggle}
        aria-pressed={selected}
      >
        <img
          className={styles.productImg}
          src={primarySrc}
          alt=""
          width={130}
          height={140}
          onError={productCardImageOnError}
        />
        <div className={styles.productDetails}>
          <div className={styles.productTitles}>
            <span className={styles.productName}>{name}</span>
            <span className={styles.productPrice}>{formatPrice(price)}</span>
          </div>
          {interact}
        </div>
      </button>
    );
  }

  return (
    <div className={styles.productCardSmallOuter}>
      <Link href={productHref} className={styles.productCardSmallThumb}>
        <img
          className={styles.productImg}
          src={primarySrc}
          alt=""
          width={130}
          height={140}
          onError={productCardImageOnError}
        />
      </Link>
      <div className={styles.productDetails}>
        <Link href={productHref} className={styles.productCardSmallTitleLink}>
          <div className={styles.productTitles}>
            <span className={styles.productName}>{name}</span>
            <span className={styles.productPrice}>{formatPrice(price)}</span>
          </div>
        </Link>
        {interact}
      </div>
    </div>
  );
}
