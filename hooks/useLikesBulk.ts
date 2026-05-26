'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { consumeCaseListLikesStale } from '@/lib/caseListLikesStale';
import { consumeDesignerListLikeStateStale } from '@/lib/designerListLikesStale';
import { fetchLikesBulkByIds, type LikesMeBatchKind } from '@/lib/likesBulkHttp';
import { setLikedMeBatchCache } from '@/lib/likesMeBatch';
import { consumeProductListLikesStale } from '@/lib/productListLikesStale';
import { getCachedIsAuthenticated, USER_SESSION_CHANGED_EVENT } from '@/lib/userSessionClient';
import { usePageAuth } from '@/contexts/UserAuthContext';

export type LikesBulkStatus = 'idle' | 'loading' | 'ready' | 'error';

function consumeStaleForKind(kind: LikesMeBatchKind): boolean {
  if (kind === 'product') return consumeProductListLikesStale();
  if (kind === 'case') return consumeCaseListLikesStale();
  return consumeDesignerListLikeStateStale();
}

export function useLikesBulk(
  kind: LikesMeBatchKind,
  entityIds: string[],
  options?: { skip?: boolean },
) {
  const skip = options?.skip === true;
  const pageAuth = usePageAuth();
  const ids = useMemo(
    () => [...new Set(entityIds.map((x) => x.trim()).filter(Boolean))],
    [entityIds],
  );
  const idsKey = ids.join('\0');

  const [likedById, setLikedById] = useState<Record<string, boolean>>({});
  const [auth, setAuth] = useState<boolean | null>(pageAuth ?? null);
  const [status, setStatus] = useState<LikesBulkStatus>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setAttempt((x) => x + 1);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useLayoutEffect(() => {
    if (consumeStaleForKind(kind)) setAttempt((x) => x + 1);
  }, [kind]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((x) => x + 1);
  }, []);

  const setLiked = useCallback(
    (entityId: string, liked: boolean) => {
      const id = entityId.trim();
      if (!id) return;
      setLikedById((prev) => ({ ...prev, [id]: liked }));
      setLikedMeBatchCache(kind, id, liked);
    },
    [kind],
  );

  useEffect(() => {
    if (pageAuth !== undefined) setAuth(pageAuth);
  }, [pageAuth]);

  useEffect(() => {
    const onSessionChanged = () => {
      void getCachedIsAuthenticated().then((ok) => {
        setAuth(ok);
        if (!skip) setAttempt((x) => x + 1);
      });
    };
    window.addEventListener(USER_SESSION_CHANGED_EVENT, onSessionChanged);
    return () => window.removeEventListener(USER_SESSION_CHANGED_EVENT, onSessionChanged);
  }, [skip]);

  useEffect(() => {
    if (skip) {
      setStatus('idle');
      return;
    }
    let cancelled = false;
    void (async () => {
      const ok = pageAuth ?? (await getCachedIsAuthenticated());
      if (cancelled) return;
      setAuth(ok);
      if (!ok || ids.length === 0) {
        setStatus('idle');
        setLikedById({});
        return;
      }
      setStatus('loading');
      try {
        const byId = await fetchLikesBulkByIds(kind, ids);
        if (cancelled) return;
        const next: Record<string, boolean> = {};
        for (const id of ids) {
          const liked = byId[id] === true;
          next[id] = liked;
          setLikedMeBatchCache(kind, id, liked);
        }
        setLikedById(next);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey, attempt, ids, kind, skip, pageAuth]);

  return {
    auth,
    status,
    likedById,
    setLiked,
    retry,
  };
}
