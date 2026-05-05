'use client';

import { useToggleLike } from '@/hooks/useToggleLike';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';
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
    return (
      <button
        type="button"
        className={styles.productDetailsInteractItem}
        disabled
        aria-disabled="true"
        aria-label="Войдите, чтобы поставить лайк"
      >
        <LikeHeartSvg className={styles.productDetailsInteractIcon} />
        <span className={styles.productDetailsInteractValue}>{Math.max(0, likesDisplayCount)}</span>
      </button>
    );
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
        <LikeHeartSvg active className={styles.productDetailsHeartActive} />
      ) : (
        <LikeHeartSvg className={styles.productDetailsInteractIcon} />
      )}
      <span className={styles.productDetailsInteractValue}>{Math.max(0, like.count)}</span>
    </button>
  );
}
