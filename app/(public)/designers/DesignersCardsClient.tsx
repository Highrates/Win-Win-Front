'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { consumeDesignerListLikeStateStale } from '@/lib/designerListLikesStale';
import { getCachedIsAuthenticated } from '@/lib/userSessionClient';
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
  const [likedById, setLikedById] = useState<Record<string, boolean>>({});
  const [auth, setAuth] = useState<boolean | null>(null);
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [bulkAttempt, setBulkAttempt] = useState(0);

  /** BFCache («Назад» из профиля): страница может восстановиться без ремаунта — снова тянем bulk. */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBulkAttempt((x) => x + 1);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  /** Лайк поставили на странице дизайнера — при заходе на список снова загружаем bulk (иначе возможен клиентский/маршрутный кеш). */
  useLayoutEffect(() => {
    if (consumeDesignerListLikeStateStale()) setBulkAttempt((x) => x + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await getCachedIsAuthenticated();
      if (cancelled) return;
      setAuth(ok);
      if (!ok || ids.length === 0) return;
      setBulkStatus('loading');
      try {
        const res = await fetch('/api/user/likes/designers/me/bulk', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ designerIds: ids }),
        });
        if (!res.ok) {
          if (!cancelled) setBulkStatus('error');
          return;
        }
        const j = (await res.json()) as { byId?: Record<string, { liked?: boolean }> };
        const byId = j.byId ?? {};
        const next: Record<string, boolean> = {};
        for (const id of ids) next[id] = byId[id]?.liked === true;
        if (!cancelled) {
          setLikedById(next);
          setBulkStatus('ready');
        }
      } catch {
        if (!cancelled) setBulkStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids, bulkAttempt]);

  return (
    <div className={styles.designersCardsWrapper}>
      {items.map((designer) => {
        const avatar = designer.photoUrl?.trim() ? designer.photoUrl.trim() : '/images/placeholder.svg';
        const likesDisplayCount = Math.max(0, designer.likesDisplayCount ?? 0);
        const liked = likedById[designer.id] === true;
        const canUseControlled = auth === true && bulkStatus === 'ready';
        const bulkLoading = auth === true && bulkStatus === 'loading';
        const bulkError = auth === true && bulkStatus === 'error';
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
                              ? (v) => setLikedById((prev) => ({ ...prev, [designer.id]: v }))
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
      {auth === true && bulkStatus === 'error' ? (
        <div role="status" aria-label="Ошибка загрузки лайков" style={{ marginTop: 12 }}>
          <button
            type="button"
            className={styles.paginationBtn}
            onClick={() => {
              setBulkStatus('loading');
              setBulkAttempt((x) => x + 1);
            }}
          >
            Повторить загрузку лайков
          </button>
        </div>
      ) : null}
    </div>
  );
}

