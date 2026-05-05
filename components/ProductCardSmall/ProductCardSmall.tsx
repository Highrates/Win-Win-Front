'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useToggleLike } from '@/hooks/useToggleLike';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';
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

  const showLikesColumn = true;

  let heartBlock: ReactNode = null;
  if (showLikesColumn) {
    if (!pickMode && like.auth !== true) {
      heartBlock = (
        <button
          type="button"
          className={styles.interactItem}
          disabled
          aria-disabled="true"
          aria-label="Войдите, чтобы поставить лайк"
        >
          <LikeHeartSvg className={styles.interactIcon} />
          <span className={styles.interactValue}>{Math.max(0, likes)}</span>
        </button>
      );
    } else if (pickMode || heartFilledControlled || !productId || !likesInteractive) {
      heartBlock = (
        <div className={styles.interactItem}>
          <LikeHeartSvg
            active={heartFilled}
            className={heartFilled ? styles.heartIconActive : styles.interactIcon}
          />
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
          <LikeHeartSvg
            active={heartFilled}
            className={heartFilled ? styles.heartIconActive : styles.interactIcon}
          />
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
