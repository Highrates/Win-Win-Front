'use client';

import { LikeBurstOverlay, useLikeBurst } from '@/components/LikeBurstHearts';
import burstStyles from '@/components/LikeBurstHearts/LikeBurstHearts.module.css';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';
import type { useToggleLike } from '@/hooks/useToggleLike';
import retryStyles from './LikeHeartInteract.module.css';

export type LikeHeartInteractClassNames = {
  interactItem: string;
  interactIcon: string;
  interactValue?: string;
  heartIconActive?: string;
};

export type LikeHeartInteractState = Pick<
  ReturnType<typeof useToggleLike>,
  | 'auth'
  | 'liked'
  | 'count'
  | 'busy'
  | 'interactiveReady'
  | 'loadLoading'
  | 'loadError'
  | 'retryLoad'
  | 'toggle'
>;

type Props = {
  state: LikeHeartInteractState;
  classNames: LikeHeartInteractClassNames;
  /** Page-level bulk: не показывать micro-batch loading/error (есть bulk UI). */
  suppressMicroLoadUi?: boolean;
  bulkLoading?: boolean;
  bulkError?: boolean;
  /** При bulkError на странице (если нет — кнопка остаётся disabled). */
  onBulkRetry?: () => void;
  guestAriaLabel?: string;
  likeAriaLabel?: string;
  unlikeAriaLabel?: string;
  stopPropagation?: boolean;
};

export function LikeHeartInteract({
  state,
  classNames: cn,
  suppressMicroLoadUi = false,
  bulkLoading = false,
  bulkError = false,
  onBulkRetry,
  guestAriaLabel = 'Войдите, чтобы поставить лайк',
  likeAriaLabel = 'Поставить лайк',
  unlikeAriaLabel = 'Убрать лайк',
  stopPropagation = false,
}: Props) {
  const {
    auth,
    liked,
    count,
    busy,
    interactiveReady,
    loadLoading,
    loadError,
    retryLoad,
    toggle,
  } = state;
  const valueCn = cn.interactValue ?? '';
  const displayCount = Math.max(0, count);
  const { burstId, triggerBurst } = useLikeBurst();

  const wrapClick = (handler: () => void) => (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    handler();
  };

  if (auth !== true) {
    return (
      <button
        type="button"
        className={cn.interactItem}
        disabled
        aria-disabled="true"
        aria-label={guestAriaLabel}
      >
        <LikeHeartSvg className={cn.interactIcon} />
        {valueCn ? <span className={valueCn}>{displayCount}</span> : null}
      </button>
    );
  }

  if (bulkLoading || (!suppressMicroLoadUi && loadLoading)) {
    return (
      <button
        type="button"
        className={cn.interactItem}
        disabled
        aria-busy="true"
        aria-label="Загрузка лайка"
      >
        <LikeHeartSvg className={cn.interactIcon} />
        {valueCn ? <span className={valueCn}>{displayCount}</span> : null}
      </button>
    );
  }

  if (bulkError) {
    if (onBulkRetry) {
      return (
        <button
          type="button"
          className={`${cn.interactItem} ${retryStyles.retryItem}`}
          onClick={wrapClick(onBulkRetry)}
          aria-label="Повторить загрузку лайков"
        >
          <LikeHeartSvg className={cn.interactIcon} />
          {valueCn ? <span className={valueCn}>{displayCount}</span> : null}
        </button>
      );
    }
    return (
      <button
        type="button"
        className={cn.interactItem}
        disabled
        aria-label="Лайк недоступен: ошибка загрузки"
      >
        <LikeHeartSvg className={cn.interactIcon} />
        {valueCn ? <span className={valueCn}>{displayCount}</span> : null}
      </button>
    );
  }

  if (!suppressMicroLoadUi && loadError) {
    return (
      <button
        type="button"
        className={`${cn.interactItem} ${retryStyles.retryItem}`}
        onClick={wrapClick(retryLoad)}
        aria-label="Повторить загрузку лайка"
      >
        <LikeHeartSvg className={cn.interactIcon} />
        {valueCn ? <span className={valueCn}>{displayCount}</span> : null}
      </button>
    );
  }

  const disabled = busy || (!suppressMicroLoadUi && !interactiveReady);

  const handleToggle = () => {
    if (!liked) triggerBurst();
    void toggle();
  };

  return (
    <button
      type="button"
      className={`${cn.interactItem} ${burstStyles.wrap}`}
      disabled={disabled}
      aria-label={liked ? unlikeAriaLabel : likeAriaLabel}
      onClick={wrapClick(handleToggle)}
    >
      <LikeBurstOverlay burstId={burstId} />
      {liked ? (
        <LikeHeartSvg active className={cn.heartIconActive ?? cn.interactIcon} />
      ) : (
        <LikeHeartSvg className={cn.interactIcon} />
      )}
      {valueCn ? <span className={valueCn}>{displayCount}</span> : null}
    </button>
  );
}
