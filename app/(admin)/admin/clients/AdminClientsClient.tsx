'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import styles from './clients.module.css';

type Row = {
  id: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  profile: { firstName: string | null; lastName: string | null } | null;
};

export function AdminClientsClient() {
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ take: '50', skip: '0' });
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/admin/backend/users/admin?${params}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) {
        setError(res.status === 401 ? 'Войдите в админку' : `Ошибка ${res.status}`);
        setItems([]);
        setTotal(0);
        return;
      }
      const data = (await res.json()) as { items: Row[]; total: number };
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError('Не удалось загрузить список');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load('');
  }, [load]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    void load(q);
  }

  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          ← В админку
        </Link>
      </p>
      <h1 className={catalogStyles.title}>Пользователи</h1>
      <p className={catalogStyles.lead}>
        Роль «покупатель» (USER). Всего: {total}
      </p>

      <form className={styles.searchForm} onSubmit={onSearchSubmit}>
        <input
          type="search"
          name="q"
          className={styles.searchInput}
          placeholder="Поиск по email или телефону"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Поиск"
        />
        <button type="submit" className={styles.searchBtn}>
          Найти
        </button>
      </form>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className={catalogStyles.lead}>Загрузка…</p> : null}

      {!loading && !error ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Телефон</th>
                <th>Имя</th>
                <th>Регистрация</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    Нет записей
                  </td>
                </tr>
              ) : (
                items.map((u) => {
                  const name =
                    [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || '—';
                  return (
                    <tr key={u.id}>
                      <td>{u.email ?? '—'}</td>
                      <td>{u.phone ?? '—'}</td>
                      <td>{name}</td>
                      <td>{new Date(u.createdAt).toLocaleString('ru-RU')}</td>
                      <td>{u.isActive ? 'Активен' : 'Неактивен'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
