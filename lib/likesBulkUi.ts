/** Состояние page-level bulk для сердечка на карточке/кейсе. */
export type LikesBulkUiState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; liked: boolean; onLikedChange: (liked: boolean) => void };
