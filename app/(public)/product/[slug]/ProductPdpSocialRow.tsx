'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getCachedIsAuthenticated } from '@/lib/userSessionClient';
import styles from './ProductPage.module.css';

type Props = {
  productId: string;
  likesDisplayCount: number;
};

/** Только лайк + счётчик; блок коллекций и комментариев остаётся в RSC `page.tsx`. */
export function ProductPdpHeartInteract({ productId, likesDisplayCount }: Props) {
  const router = useRouter();
  const [auth, setAuth] = useState<boolean | null>(null);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [count, setCount] = useState(likesDisplayCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCount(likesDisplayCount);
  }, [likesDisplayCount]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await getCachedIsAuthenticated();
      if (cancelled) return;
      setAuth(ok);
      if (!ok) return;
      try {
        const res = await fetch(`/api/user/likes/products/${encodeURIComponent(productId)}/me`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const j = (await res.json()) as { liked?: boolean };
        if (!cancelled) setLiked(j.liked === true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const toggleLike = useCallback(async () => {
    const ok = auth ?? (await getCachedIsAuthenticated());
    if (!ok) {
      router.push('/login');
      return;
    }
    if (liked === null) return;
    setBusy(true);
    const next = !liked;
    const prev = count;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/user/likes/products/${encodeURIComponent(productId)}`, {
        method: next ? 'POST' : 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        setLiked(!next);
        setCount(prev);
      }
    } catch {
      setLiked(!next);
      setCount(prev);
    } finally {
      setBusy(false);
    }
  }, [auth, liked, count, productId, router]);

  if (auth !== true) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.productDetailsInteractItem}
      disabled={busy || liked === null}
      aria-label={liked ? 'Убрать из избранного' : 'Добавить в избранное'}
      onClick={() => void toggleLike()}
    >
      {liked ? (
        <svg
          className={styles.productDetailsHeartActive}
          width={20}
          height={20}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M10.5167 17.3416C10.2334 17.4416 9.76669 17.4416 9.48335 17.3416C7.06669 16.5166 1.66669 13.0749 1.66669 7.24159C1.66669 4.66659 3.74169 2.58325 6.30002 2.58325C7.81669 2.58325 9.15835 3.31659 10 4.44992C10.8417 3.31659 12.1917 2.58325 13.7 2.58325C16.2584 2.58325 18.3334 4.66659 18.3334 7.24159C18.3334 13.0749 12.9334 16.5166 10.5167 17.3416Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <img
          src="/icons/heart.svg"
          alt=""
          width={20}
          height={20}
          className={styles.productDetailsInteractIcon}
        />
      )}
      <span className={styles.productDetailsInteractValue}>{Math.max(0, count)}</span>
    </button>
  );
}
