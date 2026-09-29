'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { teardownOrderChatWsForLogout } from '@/lib/orderChat/orderChatWsShared';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import { invalidateUserClientCaches } from '@/lib/userSessionClient';
import panelModal from '@/components/SlideInPanelModal/slideInPanelModal.module.css';
import styles from '../profileSettings.module.css';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsSessionSection() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const closeDeleteModal = useCallback(() => {
    if (deleteBusy) return;
    setDeleteModalOpen(false);
    setDeleteErr(null);
  }, [deleteBusy]);
  useModalBodyLock(deleteModalOpen, closeDeleteModal);
  useModalFocusTrap(deleteModalOpen, panelRef);

  const clearSessionAndLeave = useCallback(async () => {
    teardownOrderChatWsForLogout('account');
    invalidateUserClientCaches({ authenticated: false });
    router.push('/');
    router.refresh();
  }, [router]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/user/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      /* cookie мог очиститься на частичном ответе */
    } finally {
      await clearSessionAndLeave();
      setLoggingOut(false);
    }
  }, [clearSessionAndLeave]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleteErr(null);
    setDeleteBusy(true);
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        setDeleteErr(await readApiErrorMessage(res));
        return;
      }
      setDeleteModalOpen(false);
      await clearSessionAndLeave();
    } catch {
      setDeleteErr('Сеть или сервер недоступны');
    } finally {
      setDeleteBusy(false);
    }
  }, [clearSessionAndLeave]);

  return (
    <>
      <section
        className={`${styles.settingsSection} ${styles.settingsDangerZone}`}
        aria-label="Сессия и удаление аккаунта"
      >
        <Button
          type="button"
          variant="secondary"
          className={styles.settingsBtnSecondary}
          onClick={() => void handleLogout()}
          disabled={loggingOut || deleteBusy}
        >
          {loggingOut ? 'Выход…' : 'Выйти из аккаунта'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className={`${styles.settingsBtnSecondary} ${styles.settingsDeleteBtn}`}
          onClick={() => setDeleteModalOpen(true)}
          disabled={loggingOut || deleteBusy}
        >
          Удалить аккаунт
        </Button>
      </section>

      {deleteModalOpen ? (
        <>
          <button
            type="button"
            className={styles.settingsConfirmBackdrop}
            aria-label="Закрыть"
            onClick={closeDeleteModal}
          />
          <div
            ref={panelRef}
            className={styles.settingsConfirmPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-delete-title"
            tabIndex={-1}
          >
            <header className={styles.settingsConfirmHeader}>
              <button
                type="button"
                className={panelModal.iconBtn}
                onClick={closeDeleteModal}
                aria-label="Закрыть"
                disabled={deleteBusy}
              >
                <CloseIcon />
              </button>
            </header>
            <div className={styles.settingsConfirmBody}>
              <h3 id="settings-delete-title" className={styles.settingsConfirmTitle}>
                Удалить аккаунт?
              </h3>
              <p className={styles.settingsConfirmText}>
                Учётная запись будет деактивирована, email и телефон удалены. Заказы и история сохранятся. Действие
                необратимо.
              </p>
              {deleteErr ? (
                <p className={styles.settingsInlineError} role="alert">
                  {deleteErr}
                </p>
              ) : null}
              <div className={styles.settingsConfirmActions}>
                <Button
                  type="button"
                  variant="secondary"
                  className={styles.settingsBtnSecondary}
                  onClick={closeDeleteModal}
                  disabled={deleteBusy}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className={styles.settingsConfirmDanger}
                  disabled={deleteBusy}
                  onClick={() => void handleDeleteAccount()}
                >
                  {deleteBusy ? 'Удаление…' : 'Удалить аккаунт'}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
