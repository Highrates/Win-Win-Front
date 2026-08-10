'use client';

import { useEffect, useRef } from 'react';
import { PRODUCT_QA_TURNSTILE_SITE_KEY } from '@/lib/productQa/constants';

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onProductQaTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onProductQaTurnstileLoad';

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      window.onProductQaTurnstileLoad = () => resolve();
      if (window.turnstile) resolve();
      return;
    }
    window.onProductQaTurnstileLoad = () => resolve();
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Turnstile script failed'));
    document.head.appendChild(script);
  });
}

type Props = {
  onToken: (token: string | null) => void;
  /** Инкремент после успешного POST — remount виджета для нового challenge. */
  resetKey?: number;
};

/** Cloudflare Turnstile для POST вопроса покупателем (если задан site key). */
export function ProductQaTurnstile({ onToken, resetKey = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!PRODUCT_QA_TURNSTILE_SITE_KEY) return;
    let cancelled = false;

    void (async () => {
      try {
        await loadTurnstileScript();
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: PRODUCT_QA_TURNSTILE_SITE_KEY,
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      } catch {
        onTokenRef.current(null);
      }
    })();

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id && window.turnstile) {
        window.turnstile.remove(id);
        widgetIdRef.current = null;
      }
      onTokenRef.current(null);
    };
  }, [resetKey]);

  if (!PRODUCT_QA_TURNSTILE_SITE_KEY) return null;
  return <div ref={containerRef} aria-hidden={false} />;
}

export function isProductQaTurnstileRequired(): boolean {
  return Boolean(PRODUCT_QA_TURNSTILE_SITE_KEY);
}
