'use client';

import { useToggleLike } from '@/hooks/useToggleLike';
import styles from './ProductPage.module.css';

type Props = {
  productId: string;
  likesDisplayCount: number;
};

/** Только лайк + счётчик; блок коллекций и комментариев остаётся в RSC `page.tsx`. */
export function ProductPdpHeartInteract({ productId, likesDisplayCount }: Props) {
  const like = useToggleLike({
    kind: 'product',
    id: productId,
    likesDisplayCount,
    enabled: true,
    mode: 'uncontrolled',
  });

  if (like.auth !== true) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.productDetailsInteractItem}
      disabled={like.busy || !like.interactiveReady}
      aria-label={like.liked ? 'Убрать лайк' : 'Поставить лайк'}
      onClick={() => void like.toggle()}
    >
      {like.liked ? (
        <svg
          className={styles.productDetailsHeartActive}
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
        <img
          src="/icons/heart.svg"
          alt=""
          width={20}
          height={20}
          className={styles.productDetailsInteractIcon}
        />
      )}
      <span className={styles.productDetailsInteractValue}>{Math.max(0, like.count)}</span>
    </button>
  );
}
