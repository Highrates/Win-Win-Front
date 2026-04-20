'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField/TextField';
import { adminLoginStrings } from '@/lib/admin-i18n/adminLoginI18n';
import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';
import styles from './login.module.css';

export function AdminLoginForm({ initialLocale }: { initialLocale: AdminLocale }) {
  const str = adminLoginStrings(initialLocale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTarget = useCallback(() => {
    const from = searchParams.get('from');
    if (from && from.startsWith('/admin') && from !== '/admin/login') return from;
    return '/admin';
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/session', { credentials: 'same-origin' });
        const data = await res.json();
        if (!cancelled && data.authenticated) {
          router.replace(redirectTarget());
        }
      } catch {
        /* остаёмся на логине */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, redirectTarget]);

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
      router.replace(redirectTarget());
      router.refresh();
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
