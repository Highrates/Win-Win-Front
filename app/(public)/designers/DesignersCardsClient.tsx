'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePageLikesBulk } from '@/hooks/usePageLikesBulk';
import { DesignerLikeInteract } from '@/components/DesignerLikeInteract/DesignerLikeInteract';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';
import styles from './DesignersPage.module.css';

export type DesignersListItem = {
  id: string;
  slug: string;
  displayName: string;
  photoUrl: string | null;
  city: string | null;
  servicesLine: string | null;
  likesDisplayCount?: number;
  casesCount?: number;
};

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8.25 16.5L13.75 11L8.25 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DesignersCardsClient({ items }: { items: DesignersListItem[] }) {
  const ids = useMemo(() => items.map((x) => x.id).filter(Boolean), [items]);
  const bulk = usePageLikesBulk('designer', ids);

  return (
    <div className={styles.designersCardsWrapper}>
      {items.map((designer) => {
        const avatar = designer.photoUrl?.trim() ? designer.photoUrl.trim() : '/images/placeholder.svg';
        const likesDisplayCount = Math.max(0, designer.likesDisplayCount ?? 0);
        const liked = bulk.likedById[designer.id] === true;
        const canUseControlled = bulk.auth === true && bulk.status === 'ready';
        const bulkLoading = bulk.auth === true && bulk.status === 'loading';
        const bulkError = bulk.auth === true && bulk.status === 'error';
        return (
          <div key={designer.id || designer.slug} className={styles.designerCard}>
            <div className={styles.designerCardInner}>
              <img
                src={avatar}
                alt=""
                className={styles.designerCardAvatar}
                width={132}
                height={132}
              />
              <div className={styles.designerCardContent}>
                <div className={styles.designerCardInfo}>
                  <span className={styles.designerCardName}>{designer.displayName}</span>
                  <span className={styles.designerCardServices}>{designer.servicesLine ?? ''}</span>
                  <span className={styles.designerCardCity}>{designer.city ?? ''}</span>
                </div>
                <div className={styles.interactWrapper}>
                  <div className={styles.interactItem}>
                    <img
                      src="/icons/collections.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.interactIcon}
                    />
                    <span className={styles.interactValue}>{Math.max(0, designer.casesCount ?? 0)}</span>
                  </div>
                  {designer.id ? (
                    <div style={{ position: 'relative', zIndex: 3, pointerEvents: 'auto' }}>
                      {bulkLoading ? (
                        <button
                          type="button"
                          className={styles.interactItem}
                          disabled
                          aria-busy="true"
                          aria-label="Загрузка лайка"
                        >
                          <LikeHeartSvg className={styles.interactIcon} />
                          <span className={styles.interactValue}>{Math.max(0, likesDisplayCount)}</span>
                        </button>
                      ) : bulkError ? (
                        <button
                          type="button"
                          className={styles.interactItem}
                          disabled
                          aria-label="Лайк недоступен: ошибка загрузки"
                        >
                          <LikeHeartSvg className={styles.interactIcon} />
                          <span className={styles.interactValue}>{Math.max(0, likesDisplayCount)}</span>
                        </button>
                      ) : (
                        <DesignerLikeInteract
                          designerId={designer.id}
                          likesDisplayCount={likesDisplayCount}
                          liked={canUseControlled ? liked : undefined}
                          setLiked={
                            canUseControlled
                              ? (v) => bulk.setLiked(designer.id, v)
                              : undefined
                          }
                          classNames={{
                            interactItem: styles.interactItem,
                            interactIcon: styles.interactIcon,
                            interactValue: styles.interactValue,
                            heartIconActive: styles.heartIconActive,
                          }}
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <Link
              href={`/designers/${encodeURIComponent(designer.slug)}`}
              className={styles.designerCardLinkOverlay}
              aria-label={`Открыть профиль дизайнера ${designer.displayName}`}
            />
            <ArrowIcon className={styles.designerCardArrow} />
          </div>
        );
      })}
      {bulk.auth === true && bulk.status === 'error' ? (
        <div role="status" aria-label="Ошибка загрузки лайков" style={{ marginTop: 12 }}>
          <button type="button" className={styles.paginationBtn} onClick={bulk.retry}>
            Повторить загрузку лайков
          </button>
        </div>
      ) : null}
    </div>
  );
}
