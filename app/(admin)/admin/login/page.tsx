'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField/TextField';
import styles from './login.module.css';

function AdminLoginForm() {
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
        setError(typeof body.error === 'string' ? body.error : 'Ошибка входа');
        return;
      }
      router.replace(redirectTarget());
      router.refresh();
    } catch {
      setError('Сеть недоступна');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <main className={styles.card}>
        <h1 className={styles.title}>Админ-панель</h1>
        <p className={styles.hint}>Вход только для ролей ADMIN и MODERATOR</p>
        <form className={styles.form} onSubmit={onSubmit}>
          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Пароль"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button type="submit" variant="primary" className={styles.submit} disabled={loading}>
            {loading ? 'Вход…' : 'Войти'}
          </Button>
        </form>
        <p className={styles.footer}>
          <Link href="/">На сайт</Link>
        </p>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.wrap}>
          <main className={styles.card}>
            <p className={styles.hint}>Загрузка…</p>
          </main>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
