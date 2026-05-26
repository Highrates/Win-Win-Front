'use client';

import { useToggleLike } from '@/hooks/useToggleLike';
import { LikeHeartInteract } from '@/components/LikeHeartInteract';

type Props = {
  designerId: string;
  likesDisplayCount: number;
  /** Для листинга лучше прокидывать bulk-результат и не делать GET .../me на каждую карточку. */
  liked?: boolean;
  setLiked?: (v: boolean) => void;
  classNames: {
    interactItem: string;
    interactIcon: string;
    interactValue?: string;
    heartIconActive?: string;
  };
};

export function DesignerLikeInteract({ designerId, likesDisplayCount, liked, setLiked, classNames: cn }: Props) {
  const controlled = typeof liked === 'boolean' && typeof setLiked === 'function';
  const like = useToggleLike({
    kind: 'designer',
    id: designerId,
    likesDisplayCount,
    enabled: true,
    mode: controlled ? 'controlled' : 'uncontrolled',
    controlledLiked: controlled ? liked : undefined,
    setControlledLiked: controlled ? setLiked : undefined,
  });

  return (
    <LikeHeartInteract
      state={like}
      classNames={{
        interactItem: cn.interactItem,
        interactIcon: cn.interactIcon,
        interactValue: cn.interactValue,
        heartIconActive: cn.heartIconActive,
      }}
      suppressMicroLoadUi={controlled}
      guestAriaLabel="Войдите, чтобы поставить лайк дизайнеру"
      likeAriaLabel="Поставить лайк дизайнеру"
      unlikeAriaLabel="Убрать лайк дизайнеру"
    />
  );
}
