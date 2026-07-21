'use client';

import { useToggleLike } from '@/hooks/useToggleLike';
import { LikeHeartInteract } from '@/components/LikeHeartInteract';
import styles from './ProductPageLeftColumn.module.css';

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

  return (
    <LikeHeartInteract
      state={like}
      classNames={{
        interactItem: styles.productDetailsInteractItem,
        interactIcon: styles.productDetailsInteractIcon,
        interactValue: styles.productDetailsInteractValue,
        heartIconActive: styles.productDetailsHeartActive,
      }}
    />
  );
}
