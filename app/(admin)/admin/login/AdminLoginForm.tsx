'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField/TextField';
import { sanitizeAdminCallbackUrl } from '@/lib/adminAuth';
import { adminLoginStrings } from '@/lib/admin-i18n/adminLoginI18n';
import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';
import styles from './login.module.css';

export function AdminLoginForm({
  initialLocale,
  from,
}: {
  initialLocale: AdminLocale;
  from?: string | null;
}) {
  const str = adminLoginStrings(initialLocale);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sessionCheckDone = useRef(false);

  useEffect(() => {
    if (sessionCheckDone.current) return;
    sessionCheckDone.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/session', { credentials: 'same-origin' });
        const data = await res.json();
        if (!cancelled && data.authenticated) {
          window.location.replace(sanitizeAdminCallbackUrl(from));
        }
      } catch {
        /* остаёмся на логине */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          emailOrPhone: email.trim(),
          password: password.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === 'string' ? body.error : str.errLogin);
        return;
      }
      window.location.assign(sanitizeAdminCallbackUrl(from));
    } catch {
      setError(str.errNetwork);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <main className={styles.card}>
        <h1 className={styles.title}>{str.title}</h1>
        <p className={styles.hint}>{str.hint}</p>
        <form className={styles.form} onSubmit={onSubmit}>
          <TextField
            label={str.email}
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label={str.password}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button type="submit" variant="primary" className={styles.submit} disabled={loading}>
            {loading ? str.submitBusy : str.submit}
          </Button>
        </form>
        <p className={styles.footer}>
          <Link href="/">{str.toSite}</Link>
        </p>
      </main>
    </div>
  );
}
