'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button/Button';
import { clearSourcingDraft, hasSourcingDraftInStorage } from './sourcingDraft';
import styles from './SourcingDraftBanner.module.css';

type SourcingDraftBannerProps = {
  onContinue: () => void;
  /** Перечитать наличие черновика (например после закрытия модалки). */
  refreshKey?: unknown;
  className?: string;
};

export function SourcingDraftBanner({ onContinue, refreshKey, className }: SourcingDraftBannerProps) {
  const [visible, setVisible] = useState(false);

  const refresh = useCallback(() => {
    setVisible(hasSourcingDraftInStorage());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  if (!visible) return null;

  return (
    <div className={`${styles.banner}${className ? ` ${className}` : ''}`} role="status">
      <p className={styles.text}>У вас сохранён черновик заявки на подбор</p>
      <div className={styles.actions}>
        <Button type="button" variant="primary" onClick={onContinue}>
          Продолжить черновик
        </Button>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={() => void clearSourcingDraft().then(() => setVisible(false))}
        >
          Удалить черновик
        </button>
      </div>
    </div>
  );
}
