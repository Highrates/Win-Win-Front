'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { adminDesignerProjectsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import styles from './designer-projects.module.css';

type Row = {
  id: string;
  userId: string;
  userEmail: string | null;
  name: string;
  address: string | null;
  updatedAt: string;
  lineCount: number;
  roomCount: number;
  totalRub: number | null;
};

type ListResponse = { total: number; items: Row[] };

function formatRub(n: number | null): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return '—';
  return `~${Math.round(n).toLocaleString('ru-RU')}\u00A0₽`;
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function DesignerProjectsAdminClient({
  title,
  lead,
  searchPlaceholder,
  thProject,
  thUser,
  thLines,
  thRooms,
  thTotal,
  thUpdated,
  empty,
  loadingLabel,
  prev,
  next,
  embedded,
  filterUserId,
}: {
  title: string;
  lead: string;
  searchPlaceholder: string;
  thProject: string;
  thUser: string;
  thLines: string;
  thRooms: string;
  thTotal: string;
  thUpdated: string;
  empty: string;
  loadingLabel: string;
  prev: string;
  next: string;
  /** Без заголовка и лида — для вкладки в карточке клиента */
  embedded?: boolean;
  /** Ограничить список проектами этого пользователя */
  filterUserId?: string;
}) {
  const { locale } = useAdminLocale();
  const misc = useMemo(() => adminDesignerProjectsPage(locale), [locale]);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const hideUserColumn = Boolean(filterUserId);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filterUserId]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedQ) qs.set('q', debouncedQ);
      if (filterUserId) qs.set('userId', filterUserId);
      const res = await fetch(`/api/admin/backend/designer-projects/admin?${qs}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ListResponse;
      setTotal(typeof data.total === 'number' ? data.total : 0);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, filterUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className={embedded ? styles.panelEmbedded : styles.panel}>
      {embedded ? null : (
        <>
          <h1>{title}</h1>
          <p className={styles.lead}>{lead}</p>
        </>
      )}

      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder={searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={searchPlaceholder}
        />
      </div>

      {err ? <p className={styles.err}>{err}</p> : null}

      {loading ? <p>{loadingLabel}</p> : null}

      {!loading && items.length === 0 ? <p>{empty}</p> : null}

      {!loading && items.length > 0 ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{thProject}</th>
                  {hideUserColumn ? null : <th>{thUser}</th>}
                  <th>{thLines}</th>
                  <th>{thRooms}</th>
                  <th>{thTotal}</th>
                  <th>{thUpdated}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/designer-projects/${encodeURIComponent(r.id)}`} className={styles.rowLink}>
                        {r.name.trim() || '—'}
                      </Link>
                    </td>
                    {hideUserColumn ? null : (
                      <td>{r.userEmail?.trim() || <span className={styles.mono}>{r.userId}</span>}</td>
                    )}
                    <td>{r.lineCount}</td>
                    <td>{r.roomCount}</td>
                    <td>{formatRub(r.totalRub)}</td>
                    <td>{formatWhen(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {embedded && filterUserId ? null : (
            <div className={styles.pagination}>
              <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {prev}
              </Button>
              <span>{misc.pageOf(page, pages)}</span>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= pages}
                onClick={() => setPage((p) => (p < pages ? p + 1 : p))}
              >
                {next}
              </Button>
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}
