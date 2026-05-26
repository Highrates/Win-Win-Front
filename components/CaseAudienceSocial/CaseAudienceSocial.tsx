'use client';

import { useToggleLike } from '@/hooks/useToggleLike';
import type { LikesBulkUiState } from '@/lib/likesBulkUi';
import { LikeHeartInteract } from '@/components/LikeHeartInteract';

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
  /** Page-level bulk с /projects — без micro-batch GET на каждый кейс. */
  caseLikesBulk?: LikesBulkUiState;
};

export function CaseAudienceSocial({ caseId, likesDisplayCount, classNames: cn, caseLikesBulk }: Props) {
  const bulkReady = caseLikesBulk?.status === 'ready';
  const bulkLoading = caseLikesBulk?.status === 'loading';
  const bulkError = caseLikesBulk?.status === 'error';

  const like = useToggleLike({
    kind: 'case',
    id: caseId,
    likesDisplayCount,
    enabled: true,
    mode: bulkReady ? 'controlled' : 'uncontrolled',
    controlledLiked: bulkReady ? caseLikesBulk.liked : undefined,
    setControlledLiked: bulkReady ? caseLikesBulk.onLikedChange : undefined,
  });

  return (
    <>
      <LikeHeartInteract
        state={like}
        classNames={{
          interactItem: cn.interactItem,
          interactIcon: cn.interactIcon,
          interactValue: cn.interactValue,
          heartIconActive: cn.heartActive,
        }}
        suppressMicroLoadUi={bulkReady}
        bulkLoading={bulkLoading}
        bulkError={bulkError}
      />
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
