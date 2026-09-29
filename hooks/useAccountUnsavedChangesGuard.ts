'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const GUARD_STATE_KEY = '__accountUnsavedChangesGuard';

/**
 * Подтверждение ухода при несохранённых правках в ЛК:
 * beforeunload, клик по внутренней ссылке, «назад» браузера.
 * `confirmLeave` — Promise<boolean> (модалка аккаунта).
 */
export function useAccountUnsavedChangesGuard(
  dirty: boolean,
  confirmLeave: () => Promise<boolean>,
): void {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const confirmRef = useRef(confirmLeave);
  confirmRef.current = confirmLeave;
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    leavingRef.current = false;
    let asking = false;

    const askLeave = async (): Promise<boolean> => {
      if (asking) return false;
      asking = true;
      try {
        return await confirmRef.current();
      } finally {
        asking = false;
      }
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if ((anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      void askLeave().then((ok) => {
        if (!ok) return;
        leavingRef.current = true;
        routerRef.current.replace(`${url.pathname}${url.search}${url.hash}`);
      });
    };

    const onPopState = () => {
      if (leavingRef.current) return;
      window.history.pushState({ ...window.history.state, [GUARD_STATE_KEY]: true }, '', window.location.href);
      void askLeave().then((ok) => {
        if (!ok) return;
        leavingRef.current = true;
        window.history.go(-2);
      });
    };

    window.history.pushState({ ...window.history.state, [GUARD_STATE_KEY]: true }, '', window.location.href);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      if (!leavingRef.current && window.history.state?.[GUARD_STATE_KEY]) window.history.back();
    };
  }, [dirty]);
}
