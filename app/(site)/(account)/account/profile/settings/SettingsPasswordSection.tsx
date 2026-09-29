'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { validatePassword } from '@/lib/validation';
import styles from '../profileSettings.module.css';

export function SettingsPasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!currentPassword.trim()) {
      setPasswordError('Введите текущий пароль');
      return;
    }
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
      setPasswordError(pwdErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    setPasswordBusy(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        setPasswordError(await readApiErrorMessage(res));
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('Сеть или сервер недоступны');
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <form className={styles.settingsSection} onSubmit={(e) => void handleChangePassword(e)} style={{ marginTop: 24 }}>
      <h2 className={styles.settingsBlockTitle}>Пароль</h2>
      <div className={styles.settingsFields}>
        <TextField
          label="Текущий пароль"
          type="password"
          name="current-password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => {
            setPasswordError(null);
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
            setPasswordError(null);
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
            setPasswordError(null);
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
        <Button type="submit" variant="primary" disabled={passwordBusy}>
          {passwordBusy ? 'Сохранение…' : 'Сменить пароль'}
        </Button>
      </div>
    </form>
  );
}
