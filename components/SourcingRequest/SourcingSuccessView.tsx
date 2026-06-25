'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button/Button';
import buttonStyles from '@/components/Button/Button.module.css';
import panelModal from '@/components/SlideInPanelModal/slideInPanelModal.module.css';
import styles from './SourcingRequestModal.module.css';

type Props = {
  onClose: () => void;
};

export function SourcingSuccessView({ onClose }: Props) {
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [emailLoaded, setEmailLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/user/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null;
        try {
          const j = (await res.json()) as { user?: { email?: string | null } };
          const email = j.user?.email?.trim();
          return email || null;
        } catch {
          return null;
        }
      })
      .then((email) => {
        if (cancelled) return;
        setProfileEmail(email);
        setEmailLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setEmailLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <p className={styles.successMessage} role="status">
        {emailLoaded && profileEmail ? (
          <>
            Заявка отправлена. Отслеживайте статус в личном кабинете — ответ и уведомления также придут на{' '}
            <strong>{profileEmail}</strong>.
          </>
        ) : emailLoaded ? (
          <>
            Заявка отправлена. Отслеживайте статус в личном кабинете. Укажите email в разделе «Настройки» профиля,
            чтобы получать уведомления о заявке.
          </>
        ) : (
          <>Заявка отправлена. Отслеживайте статус в личном кабинете.</>
        )}
      </p>
      <div className={panelModal.actions}>
        <Link href="/account/orders?tab=work" className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}>
          Статус заявки
        </Link>
        {emailLoaded && !profileEmail ? (
          <Link
            href="/account/profile?tab=settings"
            className={`${buttonStyles.btn} ${buttonStyles.btnSecondary}`}
            onClick={onClose}
          >
            Открыть настройки
          </Link>
        ) : null}
        <Button type="button" variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </>
  );
}
