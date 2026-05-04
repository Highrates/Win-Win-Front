'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getCachedIsAuthenticated } from '@/lib/userSessionClient';

export type ToggleLikeKind = 'product' | 'case';

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

function mePath(kind: ToggleLikeKind, id: string): string {
  return kind === 'product'
    ? `/api/user/likes/products/${encodeURIComponent(id)}/me`
    : `/api/user/likes/cases/${encodeURIComponent(id)}/me`;
}

function togglePath(kind: ToggleLikeKind, id: string): string {
  return kind === 'product'
    ? `/api/user/likes/products/${encodeURIComponent(id)}`
    : `/api/user/likes/cases/${encodeURIComponent(id)}`;
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
  const [auth, setAuth] = useState<boolean | null>(null);
  const [likedFromApi, setLikedFromApi] = useState<boolean | null>(null);
  const [count, setCount] = useState(likesDisplayCount);
  const [busy, setBusy] = useState(false);

  const isControlled = mode === 'controlled';

  useEffect(() => {
    setCount(likesDisplayCount);
  }, [likesDisplayCount]);

  useEffect(() => {
    let cancelled = false;
    if (!enabled || !id || isControlled) {
      setLikedFromApi(null);
    }
    void (async () => {
      const ok = await getCachedIsAuthenticated();
      if (cancelled) return;
      setAuth(ok);
      if (!ok || !enabled || !id || isControlled) return;
      try {
        const res = await fetch(mePath(kind, id), {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as { liked?: boolean };
        if (!cancelled) setLikedFromApi(j.liked === true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, id, enabled, isControlled]);

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
    const prevCount = count;
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
      onMutationSuccess?.({ liked: serverLiked, likesDisplayCount: finalCount, id });
    } catch {
      rollback();
    } finally {
      setBusy(false);
    }
  }, [
    auth,
    kind,
    id,
    enabled,
    isControlled,
    controlledLiked,
    likedFromApi,
    count,
    router,
    setControlledLiked,
    onMutationSuccess,
  ]);

  return {
    auth,
    liked: likedForUi,
    /** Для aria / иконки (как раньше heartFilled при интерактиве). */
    likedFilled: likedForUi,
    count,
    busy,
    interactiveReady,
    toggle,
  };
}
