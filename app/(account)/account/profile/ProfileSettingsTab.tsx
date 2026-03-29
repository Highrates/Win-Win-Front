'use client';

import { useCallback, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import styles from './page.module.css';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfileSettingsTab() {
  const [email, setEmail] = useState('designer@example.com');
  const [phone, setPhone] = useState('+7 900 000-00-00');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const closeDeleteModal = useCallback(() => setDeleteModalOpen(false), []);
  useModalBodyLock(deleteModalOpen, closeDeleteModal);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: PATCH user contact
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword.trim()) {
      setPasswordError('Введите текущий пароль');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Новый пароль — не менее 8 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    // TODO: API смены пароля
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: PATCH notification prefs
  };

  return (
    <>
      <div className={styles.settingsRoot} aria-label="Настройки аккаунта">
        <form className={styles.settingsSection} onSubmit={handleSaveContact}>
          <div className={styles.settingsFields}>
            <TextField
              label="Email"
              type="email"
              name="settings-email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Телефон"
              type="tel"
              name="settings-phone"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className={styles.settingsActions}>
            <Button type="submit" variant="primary">
              Сохранить
            </Button>
          </div>
        </form>

        <form className={styles.settingsSection} onSubmit={handleChangePassword}>
          <div className={styles.settingsFields}>
            <TextField
              label="Текущий пароль"
              type="password"
              name="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => {
                setPasswordError('');
                setCurrentPassword(e.target.value);
              }}
            />
            <TextField
              label="Новый пароль"
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setPasswordError('');
                setNewPassword(e.target.value);
              }}
            />
            <TextField
              label="Повторите новый пароль"
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setPasswordError('');
                setConfirmPassword(e.target.value);
              }}
            />
          </div>
          {passwordError ? (
            <p className={styles.settingsInlineError} role="alert">
              {passwordError}
            </p>
          ) : null}
          <div className={styles.settingsActions}>
            <Button type="submit" variant="primary">
              Сохранить
            </Button>
          </div>
        </form>

        <form className={styles.settingsSection} onSubmit={handleSaveNotifications}>
          <div className={styles.settingsSwitches}>
            <h2 className={styles.settingsSwitchesTitle}>Уведомления</h2>
            <label className={styles.settingsSwitchRow}>
              <AccountCheckbox
                className={styles.settingsSwitchCheckbox}
                checked={notifyOrders}
                onChange={(e) => setNotifyOrders(e.target.checked)}
                aria-label="Заказы и согласования: статусы заказов и напоминания по поставкам"
              />
              <span className={styles.settingsSwitchText}>
                <span className={styles.settingsSwitchLabel}>Заказы и согласования</span>
                <span className={styles.settingsSwitchDesc}>Статусы заказов, напоминания по поставкам</span>
              </span>
            </label>
            <label className={styles.settingsSwitchRow}>
              <AccountCheckbox
                className={styles.settingsSwitchCheckbox}
                checked={notifyMessages}
                onChange={(e) => setNotifyMessages(e.target.checked)}
                aria-label="Сообщения: новые запросы и ответы в чатах"
              />
              <span className={styles.settingsSwitchText}>
                <span className={styles.settingsSwitchLabel}>Сообщения</span>
                <span className={styles.settingsSwitchDesc}>Новые запросы и ответы в чатах</span>
              </span>
            </label>
            <label className={styles.settingsSwitchRow}>
              <AccountCheckbox
                className={styles.settingsSwitchCheckbox}
                checked={notifyMarketing}
                onChange={(e) => setNotifyMarketing(e.target.checked)}
                aria-label="Новости и предложения: акции и обновления каталога"
              />
              <span className={styles.settingsSwitchText}>
                <span className={styles.settingsSwitchLabel}>Новости и предложения</span>
                <span className={styles.settingsSwitchDesc}>Акции, обновления каталога и сервиса</span>
              </span>
            </label>
          </div>
          <div className={styles.settingsActions}>
            <Button type="submit" variant="secondary" className={styles.settingsBtnSecondary}>
              Сохранить
            </Button>
          </div>
        </form>

        <section className={`${styles.settingsSection} ${styles.settingsDangerZone}`} aria-label="Удаление аккаунта">
          <Button
            type="button"
            variant="secondary"
            className={`${styles.settingsBtnSecondary} ${styles.settingsDeleteBtn}`}
            onClick={() => setDeleteModalOpen(true)}
          >
            Удалить аккаунт
          </Button>
        </section>
      </div>

      {deleteModalOpen ? (
        <>
          <button
            type="button"
            className={styles.settingsConfirmBackdrop}
            aria-label="Закрыть"
            onClick={closeDeleteModal}
          />
          <div
            className={styles.settingsConfirmPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-delete-title"
          >
            <header className={styles.settingsConfirmHeader}>
              <button type="button" className={styles.aboutModalIconBtn} onClick={closeDeleteModal} aria-label="Закрыть">
                <CloseIcon />
              </button>
            </header>
            <div className={styles.settingsConfirmBody}>
              <h3 id="settings-delete-title" className={styles.settingsConfirmTitle}>
                Удалить аккаунт?
              </h3>
              <p className={styles.settingsConfirmText}>
                Мы отправим подтверждение на ваш email. До финального подтверждения вход останется доступен.
              </p>
              <div className={styles.settingsConfirmActions}>
                <Button type="button" variant="secondary" className={styles.settingsBtnSecondary} onClick={closeDeleteModal}>
                  Отмена
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className={styles.settingsConfirmDanger}
                  onClick={() => {
                    closeDeleteModal();
                    // TODO: POST account deletion request
                  }}
                >
                  Запросить удаление
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
