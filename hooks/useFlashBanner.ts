import { useCallback, useEffect, useState } from 'react';

export type FlashBannerPayload = {
  variant: 'error' | 'success';
  message: string;
};

/** Короткое уведомление (ошибка сети / успех); автоскрытие через `durationMs`. */
export function useFlashBanner(durationMs = 7000) {
  const [flash, setFlash] = useState<FlashBannerPayload | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), durationMs);
    return () => window.clearTimeout(t);
  }, [flash, durationMs]);

  const pushError = useCallback((message: string) => {
    setFlash({ variant: 'error', message });
  }, []);

  const pushSuccess = useCallback((message: string) => {
    setFlash({ variant: 'success', message });
  }, []);

  const dismiss = useCallback(() => setFlash(null), []);

  return { flash, pushError, pushSuccess, dismiss };
}
