'use client';

import { useEffect } from 'react';
import styles from './AdminFlashBanner.module.css';

export type AdminFlashBannerKind = 'ok' | 'error';

export type AdminFlashBannerState = {
  kind: AdminFlashBannerKind;
  text: string;
} | null;

type Props = {
  flash: AdminFlashBannerState;
  onClear: () => void;
  dismissLabel: string;
  autoHideMs?: number;
};

export function AdminFlashBanner({ flash, onClear, dismissLabel, autoHideMs = 5000 }: Props) {
  useEffect(() => {
    if (!flash || autoHideMs <= 0) return;
    const t = window.setTimeout(onClear, autoHideMs);
    return () => window.clearTimeout(t);
  }, [flash, onClear, autoHideMs]);

  if (!flash) return null;

  return (
    <div
      className={`${styles.banner} ${flash.kind === 'error' ? styles.error : styles.ok}`}
      role={flash.kind === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <p className={styles.text}>{flash.text}</p>
      <button type="button" className={styles.dismiss} onClick={onClear} aria-label={dismissLabel}>
        ×
      </button>
    </div>
  );
}
