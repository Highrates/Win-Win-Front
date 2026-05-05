'use client';

import { useToggleLike } from '@/hooks/useToggleLike';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';

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

  if (like.auth !== true) {
    return (
      <button
        type="button"
        className={cn.interactItem}
        disabled
        aria-disabled="true"
        aria-label="Войдите, чтобы поставить лайк дизайнеру"
      >
        <LikeHeartSvg className={cn.interactIcon} />
        <span className={cn.interactValue}>{Math.max(0, likesDisplayCount)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn.interactItem}
      disabled={like.busy || !like.interactiveReady}
      aria-label={like.liked ? 'Убрать лайк дизайнеру' : 'Поставить лайк дизайнеру'}
      onClick={() => void like.toggle()}
    >
      {like.liked ? (
        <LikeHeartSvg active className={cn.heartIconActive ?? cn.interactIcon} />
      ) : (
        <LikeHeartSvg className={cn.interactIcon} />
      )}
      <span className={cn.interactValue}>{Math.max(0, like.count)}</span>
    </button>
  );
}

