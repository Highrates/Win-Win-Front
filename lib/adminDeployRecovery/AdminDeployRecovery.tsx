'use client';

import { useEffect } from 'react';

const SESSION_RELOAD_KEY = 'admin-deploy-reload';
const BUILD_ID_STORAGE_KEY = 'admin-build-id';

function isNextStaticAsset(url: string): boolean {
  try {
    return new URL(url, window.location.origin).pathname.startsWith('/_next/static/');
  } catch {
    return url.includes('/_next/static/');
  }
}

function shouldRecoverFromMessage(message: unknown): boolean {
  if (typeof message !== 'string') return false;
  return (
    message.includes('Loading chunk') ||
    message.includes('ChunkLoadError') ||
    message.includes('Failed to fetch dynamically imported module')
  );
}

function reloadOncePerSession(): void {
  try {
    if (sessionStorage.getItem(SESSION_RELOAD_KEY) === '1') return;
    sessionStorage.setItem(SESSION_RELOAD_KEY, '1');
  } catch {
    /* ignore */
  }
  window.location.reload();
}

/** После деплоя SPA может запрашивать чанки старой сборки — один reload за сессию. */
export function AdminDeployRecovery({ buildId }: { buildId: string }) {
  useEffect(() => {
    try {
      const prev = sessionStorage.getItem(BUILD_ID_STORAGE_KEY);
      if (prev && prev !== buildId) {
        sessionStorage.removeItem(SESSION_RELOAD_KEY);
      }
      sessionStorage.setItem(BUILD_ID_STORAGE_KEY, buildId);
    } catch {
      /* ignore */
    }

    function onError(event: ErrorEvent) {
      const target = event.target;
      if (target instanceof HTMLScriptElement && target.src && isNextStaticAsset(target.src)) {
        reloadOncePerSession();
        return;
      }
      if (target instanceof HTMLLinkElement && target.href && isNextStaticAsset(target.href)) {
        reloadOncePerSession();
        return;
      }
      if (shouldRecoverFromMessage(event.message)) {
        reloadOncePerSession();
      }
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : '';
      const name = reason instanceof Error ? reason.name : '';
      if (name === 'ChunkLoadError' || shouldRecoverFromMessage(message)) {
        reloadOncePerSession();
      }
    }

    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [buildId]);

  return null;
}
