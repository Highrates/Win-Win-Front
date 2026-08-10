'use client';

import { useCallback, useEffect, useState } from 'react';
import { PRODUCT_QA_POST_COOLDOWN_MS } from '@/lib/productQa/constants';

function isCooldownError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /подождите/i.test(msg) || /\b429\b/.test(msg);
}

/** Countdown на кнопке POST после cooldown 429 / «Подождите…». */
export function useProductQaPostCooldown(cooldownMs = PRODUCT_QA_POST_COOLDOWN_MS) {
  const [untilMs, setUntilMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!untilMs) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [untilMs]);

  useEffect(() => {
    if (untilMs != null && untilMs <= nowMs) {
      setUntilMs(null);
    }
  }, [nowMs, untilMs]);

  const remainingSeconds =
    untilMs != null ? Math.max(0, Math.ceil((untilMs - nowMs) / 1000)) : 0;
  const isCoolingDown = remainingSeconds > 0;

  const triggerCooldown = useCallback(() => {
    setUntilMs(Date.now() + cooldownMs);
  }, [cooldownMs]);

  const handlePostError = useCallback(
    (err: unknown) => {
      if (isCooldownError(err)) {
        triggerCooldown();
      }
    },
    [triggerCooldown],
  );

  return { remainingSeconds, isCoolingDown, triggerCooldown, handlePostError };
}
