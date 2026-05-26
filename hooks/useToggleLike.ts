'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLikedMeBatched, setLikedMeBatchCache, type LikesMeBatchKind } from '@/lib/likesMeBatch';
import { markDesignerListLikeStateStale } from '@/lib/designerListLikesStale';
import { markCaseListLikesStale } from '@/lib/caseListLikesStale';
import { markProductListLikesStale } from '@/lib/productListLikesStale';
import { usePageAuth } from '@/contexts/UserAuthContext';
import { getCachedIsAuthenticated } from '@/lib/userSessionClient';

export type ToggleLikeKind = LikesMeBatchKind;

export type UseToggleLikeOptions = {
  kind: ToggleLikeKind;
  id: string | undefined;
  likesDisplayCount: number;
  /** Лайк с API и POST/DELETE (как у карточки с productId). */
  enabled?: boolean;
  /** Режим списка лайков в ЛК: без GET …/me, liked из стейта родителя. */
  mode?: 'uncontrolled' | 'controlled';
  controlledLiked?: boolean;
  setControlledLiked?: (v: boolean) => void;
  /** После успешного ответа (серверные liked и счётчик). Только для kind === 'product' в типичном использовании. */
  onMutationSuccess?: (state: { liked: boolean; likesDisplayCount: number; id: string }) => void;
};

function togglePath(kind: ToggleLikeKind, id: string): string {
  return kind === 'product'
    ? `/api/user/likes/products/${encodeURIComponent(id)}`
    : kind === 'case'
      ? `/api/user/likes/cases/${encodeURIComponent(id)}`
      : `/api/user/likes/designers/${encodeURIComponent(id)}`;
}

function parseMutationBody(data: unknown): { liked?: boolean; likesDisplayCount?: number } {
  if (!data || typeof data !== 'object') return {};
  const j = data as Record<string, unknown>;
  const liked = typeof j.liked === 'boolean' ? j.liked : undefined;
  const likesDisplayCount =
    typeof j.likesDisplayCount === 'number' && Number.isFinite(j.likesDisplayCount)
      ? j.likesDisplayCount
      : undefined;
  return { liked, likesDisplayCount };
}

export function useToggleLike(options: UseToggleLikeOptions) {
  const {
    kind,
    id,
    likesDisplayCount,
    enabled = true,
    mode = 'uncontrolled',
    controlledLiked,
    setControlledLiked,
    onMutationSuccess,
  } = options;
  const router = useRouter();
  const pageAuth = usePageAuth();
  const [auth, setAuth] = useState<boolean | null>(pageAuth ?? null);
  const [likedFromApi, setLikedFromApi] = useState<boolean | null>(null);
  const [loadLoading, setLoadLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [count, setCount] = useState(likesDisplayCount);
  const [busy, setBusy] = useState(false);
  const countRef = useRef(count);
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  const isControlled = mode === 'controlled';

  useEffect(() => {
    setCount(likesDisplayCount);
  }, [likesDisplayCount]);

  useEffect(() => {
    if (pageAuth !== undefined) setAuth(pageAuth);
  }, [pageAuth]);

  const retryLoad = useCallback(() => {
    if (isControlled) return;
    setLoadError(false);
    setLoadAttempt((x) => x + 1);
  }, [isControlled]);

  useEffect(() => {
    let cancelled = false;
    if (!enabled || !id || isControlled) {
      setLikedFromApi(null);
      setLoadLoading(false);
      setLoadError(false);
      return;
    }
    setLoadLoading(true);
    setLoadError(false);
    void (async () => {
      const ok = pageAuth ?? (await getCachedIsAuthenticated());
      if (cancelled) return;
      setAuth(ok);
      if (!ok || !enabled || !id) {
        setLoadLoading(false);
        return;
      }
      try {
        const liked = await fetchLikedMeBatched(kind, id);
        if (!cancelled) {
          setLikedFromApi(liked);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setLikedFromApi(null);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoadLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, id, enabled, isControlled, pageAuth, loadAttempt]);

  const likedForUi = isControlled ? !!controlledLiked : likedFromApi === true;
  const interactiveReady = isControlled || likedFromApi !== null;

  const toggle = useCallback(async () => {
    if (!enabled || !id) return;
    const ok = auth ?? (await getCachedIsAuthenticated());
    if (!ok) {
      router.push('/login');
      return;
    }
    const currentLiked = isControlled ? !!controlledLiked : likedFromApi === true;
    if (!isControlled && likedFromApi === null) return;

    setBusy(true);
    const nextLiked = !currentLiked;
    const prevCount = countRef.current;
    if (isControlled) setControlledLiked?.(nextLiked);
    else setLikedFromApi(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    const rollback = () => {
      if (isControlled) setControlledLiked?.(currentLiked);
      else setLikedFromApi(currentLiked);
      setCount(prevCount);
    };

    try {
      const res = await fetch(togglePath(kind, id), {
        method: nextLiked ? 'POST' : 'DELETE',
        credentials: 'same-origin',
      });
      if (res.status === 401) {
        router.push('/login');
        rollback();
        return;
      }
      if (!res.ok) {
        rollback();
        return;
      }
      let serverLiked = nextLiked;
      let serverCount: number | null = null;
      try {
        const j = parseMutationBody(await res.json());
        if (typeof j.liked === 'boolean') serverLiked = j.liked;
        if (typeof j.likesDisplayCount === 'number') serverCount = j.likesDisplayCount;
      } catch {
        /* оптимистичное */
      }
      const finalCount =
        serverCount !== null
          ? Math.max(0, serverCount)
          : Math.max(0, prevCount + (nextLiked ? 1 : -1));
      if (isControlled) setControlledLiked?.(serverLiked);
      else setLikedFromApi(serverLiked);
      setCount(finalCount);
      setLikedMeBatchCache(kind, id, serverLiked);
      if (kind === 'designer') markDesignerListLikeStateStale();
      if (kind === 'product') markProductListLikesStale();
      if (kind === 'case') markCaseListLikesStale();
      onMutationSuccess?.({ liked: serverLiked, likesDisplayCount: finalCount, id });
    } catch {
      rollback();
    } finally {
      setBusy(false);
    }
  }, [auth, kind, id, enabled, isControlled, controlledLiked, likedFromApi, router, setControlledLiked, onMutationSuccess]);

  return {
    auth,
    liked: likedForUi,
    likedFilled: likedForUi,
    count,
    busy,
    interactiveReady,
    loadLoading,
    loadError,
    retryLoad,
    toggle,
  };
}
