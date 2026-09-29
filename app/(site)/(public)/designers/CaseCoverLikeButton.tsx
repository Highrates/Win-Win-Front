'use client';

import { LikeHeartInteract } from '@/components/LikeHeartInteract';
import { useToggleLike } from '@/hooks/useToggleLike';
import type { LikesBulkUiState } from '@/lib/likesBulkUi';

export function CaseCoverLikeButton({
  caseId,
  likesDisplayCount,
  classNames,
  caseLikesBulk,
}: {
  caseId: string;
  likesDisplayCount: number;
  classNames: {
    btn: string;
    icon: string;
    iconActive: string;
    value: string;
  };
  caseLikesBulk?: LikesBulkUiState;
}) {
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
    <LikeHeartInteract
      state={like}
      classNames={{
        interactItem: classNames.btn,
        interactIcon: classNames.icon,
        interactValue: classNames.value,
        heartIconActive: classNames.iconActive,
      }}
      suppressMicroLoadUi={bulkReady}
      bulkLoading={bulkLoading}
      bulkError={bulkError}
      stopPropagation
    />
  );
}
