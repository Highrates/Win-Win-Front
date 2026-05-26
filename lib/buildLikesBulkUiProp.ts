import type { LikesBulkUiState } from '@/lib/likesBulkUi';
import type { LikesBulkStatus } from '@/hooks/useLikesBulk';

type BulkSlice = {
  auth: boolean | null;
  status: LikesBulkStatus;
  likedById: Record<string, boolean>;
};

export function buildLikesBulkUiProp(
  bulk: BulkSlice,
  entityId: string | undefined,
  onLikedChange: (id: string, liked: boolean) => void,
): LikesBulkUiState | undefined {
  const id = entityId?.trim();
  if (bulk.auth !== true || !id) return undefined;
  if (bulk.status === 'ready') {
    return {
      status: 'ready',
      liked: bulk.likedById[id] === true,
      onLikedChange: (liked) => onLikedChange(id, liked),
    };
  }
  if (bulk.status === 'loading') return { status: 'loading' };
  if (bulk.status === 'error') return { status: 'error' };
  return undefined;
}
