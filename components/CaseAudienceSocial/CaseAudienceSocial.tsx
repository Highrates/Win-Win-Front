'use client';

import { useToggleLike } from '@/hooks/useToggleLike';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';

type ClassNames = {
  interactItem: string;
  interactIcon: string;
  interactValue: string;
  heartActive: string;
};

type Props = {
  caseId: string;
  likesDisplayCount: number;
  classNames: ClassNames;
};

export function CaseAudienceSocial({ caseId, likesDisplayCount, classNames: cn }: Props) {
  const like = useToggleLike({
    kind: 'case',
    id: caseId,
    likesDisplayCount,
    enabled: true,
    mode: 'uncontrolled',
  });

  const showHeart = true;

  return (
    <>
      {showHeart ? (
        like.auth !== true ? (
          <button
            type="button"
            className={cn.interactItem}
            disabled
            aria-disabled="true"
            aria-label="Войдите, чтобы поставить лайк"
          >
            <LikeHeartSvg className={cn.interactIcon} />
            <span className={cn.interactValue}>{Math.max(0, likesDisplayCount)}</span>
          </button>
        ) : (
        <button
          type="button"
          className={cn.interactItem}
          disabled={like.busy || !like.interactiveReady}
          aria-label={like.liked ? 'Убрать лайк' : 'Поставить лайк'}
          onClick={() => void like.toggle()}
        >
          {like.liked ? (
            <LikeHeartSvg active className={cn.heartActive} />
          ) : (
            <LikeHeartSvg className={cn.interactIcon} />
          )}
          <span className={cn.interactValue}>{Math.max(0, like.count)}</span>
        </button>
        )
      ) : null}
      <div className={cn.interactItem}>
        <img
          src="/icons/message.svg"
          alt=""
          width={20}
          height={20}
          className={cn.interactIcon}
        />
        <span className={cn.interactValue}>0</span>
      </div>
    </>
  );
}
