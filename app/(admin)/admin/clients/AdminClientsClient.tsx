'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminClientsStrings } from '@/lib/admin-i18n/adminClientsI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import styles from './clients.module.css';

type Row = {
  id: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  profile: { firstName: string | null; lastName: string | null; winWinPartnerApproved?: boolean | null } | null;
};

export function AdminClientsClient() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminClientsStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [designerTotal, setDesignerTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (search: string) => {
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
          setError(res.status === 401 ? s.loginRequired : s.errStatus(res.status));
          setItems([]);
          setTotal(0);
          setDesignerTotal(0);
          return;
        }
        const data = (await res.json()) as { items: Row[]; total: number; designerTotal?: number };
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setDesignerTotal(typeof data.designerTotal === 'number' ? data.designerTotal : 0);
      } catch {
        setError(s.errLoadList);
        setItems([]);
        setTotal(0);
        setDesignerTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [s.errLoadList, s.errStatus, s.loginRequired],
  );

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
          {s.backAdmin}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>{s.pageTitle}</h1>
      <p className={catalogStyles.lead}>{s.pageLead({ total, designers: designerTotal })}</p>

      <form className={styles.searchForm} onSubmit={onSearchSubmit}>
        <input
          type="search"
          name="q"
          className={styles.searchInput}
          placeholder={s.searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={s.searchAria}
        />
        <button type="submit" className={styles.searchBtn}>
          {s.find}
        </button>
      </form>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className={catalogStyles.lead}>{c.loading}</p> : null}

      {!loading && !error ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{s.thEmail}</th>
                <th>{s.thPhone}</th>
                <th>{s.thName}</th>
                <th>{s.thRegistered}</th>
                <th>{s.thStatus}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    {s.emptyTable}
                  </td>
                </tr>
              ) : (
                items.map((u) => {
                  const name =
                    [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || '—';
                  return (
                    <tr
                      key={u.id}
                      className={styles.clickableRow}
                      tabIndex={0}
                      onClick={() => router.push(`/admin/clients/${u.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/admin/clients/${u.id}`);
                        }
                      }}
                    >
                      <td>{u.email ?? '—'}</td>
                      <td>{u.phone ?? '—'}</td>
                      <td>{name}</td>
                      <td>{new Date(u.createdAt).toLocaleString(dateLocale)}</td>
                      <td>
                        {u.profile?.winWinPartnerApproved ? s.statusPartner : u.isActive ? s.active : s.inactive}
                      </td>
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
