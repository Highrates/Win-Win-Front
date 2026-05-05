'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useToggleLike } from '@/hooks/useToggleLike';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';
import designerCardStyles from '@/app/(public)/designers/DesignersPage.module.css';

export type FavoriteDesignerDto = {
  id: string;
  slug: string;
  displayName: string;
  photoUrl: string | null;
  city: string | null;
  servicesLine: string | null;
  likesDisplayCount: number;
};

export function FavoriteDesignerCard({
  designer,
  onUnliked,
}: {
  designer: FavoriteDesignerDto;
  onUnliked: (designerId: string) => void;
}) {
  const [liked, setLiked] = useState(true);
  const like = useToggleLike({
    kind: 'designer',
    id: designer.id,
    likesDisplayCount: designer.likesDisplayCount,
    enabled: true,
    mode: 'controlled',
    controlledLiked: liked,
    setControlledLiked: setLiked,
    onMutationSuccess: ({ liked: nextLiked, id }) => {
      if (!nextLiked) onUnliked(id);
    },
  });

  const avatar = designer.photoUrl?.trim() ? designer.photoUrl.trim() : '/images/placeholder.svg';

  return (
    <div className={designerCardStyles.designerCard}>
      <div className={designerCardStyles.designerCardInner}>
        <img src={avatar} alt="" className={designerCardStyles.designerCardAvatar} width={132} height={132} />
        <div className={designerCardStyles.designerCardContent}>
          <div className={designerCardStyles.designerCardInfo}>
            <span className={designerCardStyles.designerCardName}>{designer.displayName}</span>
            <span className={designerCardStyles.designerCardServices}>{designer.servicesLine ?? ''}</span>
            <span className={designerCardStyles.designerCardCity}>{designer.city ?? ''}</span>
          </div>
          <div className={designerCardStyles.interactWrapper}>
            <div className={designerCardStyles.interactItem}>
              <img src="/icons/collections.svg" alt="" width={20} height={20} className={designerCardStyles.interactIcon} />
              <span className={designerCardStyles.interactValue}>0</span>
            </div>
            <div style={{ position: 'relative', zIndex: 3, pointerEvents: 'auto' }}>
              <button
                type="button"
                className={designerCardStyles.interactItem}
                disabled={like.busy}
                aria-label={liked ? 'Убрать лайк дизайнеру' : 'Поставить лайк дизайнеру'}
                onClick={() => void like.toggle()}
              >
                {liked ? (
                  <LikeHeartSvg active className={designerCardStyles.heartIconActive} />
                ) : (
                  <LikeHeartSvg className={designerCardStyles.interactIcon} />
                )}
                <span className={designerCardStyles.interactValue}>{Math.max(0, like.count)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <Link
        href={`/designers/${encodeURIComponent(designer.slug)}`}
        className={designerCardStyles.designerCardLinkOverlay}
        aria-label={`Открыть профиль дизайнера ${designer.displayName}`}
      />
    </div>
  );
}

