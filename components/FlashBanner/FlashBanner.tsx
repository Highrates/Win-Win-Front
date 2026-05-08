'use client';

import styles from './FlashBanner.module.css';
import type { FlashBannerPayload } from '@/hooks/useFlashBanner';

type Props = {
  flash: FlashBannerPayload | null;
  onDismiss: () => void;
};

export function FlashBanner({ flash, onDismiss }: Props) {
  if (!flash) return null;
  const cls = flash.variant === 'error' ? styles.error : styles.success;
  return (
    <div className={`${styles.root} ${cls}`} role="alert">
      <span className={styles.text}>{flash.message}</span>
      <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Закрыть">
        ×
      </button>
    </div>
  );
}
