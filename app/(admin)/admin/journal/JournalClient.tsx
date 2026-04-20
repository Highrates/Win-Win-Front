'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminJournalStrings } from '@/lib/admin-i18n/adminJournalI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import styles from '../catalog/catalogAdmin.module.css';

export type AuditLogRow = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  httpMethod: string | null;
  path: string;
  metadata: unknown;
  ip: string | null;
  userAgent: string | null;
};

type ListResponse = {
  items: AuditLogRow[];
  total: number;
  page: number;
  limit: number;
};

const PAGE_SIZE = 50;

function formatWhen(iso: string, dateLocale: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(dateLocale, {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(d);
  } catch {
    return iso;
  }
}

function metadataPreview(meta: unknown): string {
  if (meta === null || meta === undefined) return '—';
  try {
    const json = JSON.stringify(meta);
    return json.length > 120 ? `${json.slice(0, 117)}…` : json;
  } catch {
    return '—';
  }
}

type SessionRes = { authenticated: boolean; user?: { role?: string } };

export function JournalClient() {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminJournalStrings(locale), [locale]);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [purgePassword, setPurgePassword] = useState('');
  const [purgeBusy, setPurgeBusy] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/session', { credentials: 'same-origin' });
        const j = (await res.json()) as SessionRes;
        setIsAdmin(j.authenticated && j.user?.role === 'ADMIN');
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminBackendJson<ListResponse>(
          `audit/admin/logs?page=${p}&limit=${PAGE_SIZE}`,
        );
        setData(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : s.errLoad);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [s],
  );

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  async function runPurge() {
    if (!purgePassword.trim()) {
      setPurgeMessage(s.purgePasswordPrompt);
      return;
    }
    if (!window.confirm(s.purgeConfirm)) {
      return;
    }
    setPurgeBusy(true);
    setPurgeMessage(null);
    try {
      const res = await adminBackendJson<{ deleted: number }>('audit/admin/purge', {
        method: 'POST',
        body: JSON.stringify({ password: purgePassword }),
      });
      setPurgePassword('');
      setPurgeMessage(s.purged(res.deleted));
      void load(page);
    } catch (e) {
      setPurgeMessage(e instanceof Error ? e.message : s.purgeErr);
    } finally {
      setPurgeBusy(false);
    }
  }

  return (
    <>
      {error ? (
        <p className={styles.lead} style={{ color: '#b42318' }}>
          {error}
        </p>
      ) : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{s.thWhen}</th>
              <th>{s.thAction}</th>
              <th>{s.thWho}</th>
              <th>{s.thPath}</th>
              <th>{s.thEntity}</th>
              <th>{s.thDetails}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>{s.loading}</td>
              </tr>
            ) : null}
            {!loading && data?.items.length === 0 ? (
              <tr>
                <td colSpan={6}>{s.empty}</td>
              </tr>
            ) : null}
            {data?.items.map((row) => (
              <tr key={row.id}>
                <td>{formatWhen(row.createdAt, dateLocale)}</td>
                <td>
                  {row.httpMethod ? `${row.httpMethod} · ` : ''}
                  {row.action}
                </td>
                <td>
                  {row.actorEmail || row.actorUserId || '—'}
                  {row.actorRole ? (
                    <>
                      <br />
                      <span style={{ fontSize: '0.85em', color: 'var(--color-gray, #9d9d9d)' }}>
                        {row.actorRole}
                      </span>
                    </>
                  ) : null}
                </td>
                <td style={{ maxWidth: 220, wordBreak: 'break-all', fontSize: '0.85rem' }}>
                  {row.path}
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  {row.entityType || '—'}
                  {row.entityId ? (
                    <>
                      <br />
                      <code style={{ fontSize: '0.8em' }}>{row.entityId}</code>
                    </>
                  ) : null}
                </td>
                <td style={{ maxWidth: 280, fontSize: '0.8rem', wordBreak: 'break-word' }}>
                  {metadataPreview(row.metadata)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && totalPages > 1 ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <button
            type="button"
            className={styles.backLink}
            style={{
              border: '1px solid var(--account-hairline-color, #e2e6e8)',
              padding: '6px 12px',
              background: 'transparent',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.5 : 1,
            }}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {s.back}
          </button>
          <span style={{ fontSize: '0.9rem' }}>{s.pageOf(page, totalPages, data.total)}</span>
          <button
            type="button"
            className={styles.backLink}
            style={{
              border: '1px solid var(--account-hairline-color, #e2e6e8)',
              padding: '6px 12px',
              background: 'transparent',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.5 : 1,
            }}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {s.forward}
          </button>
        </div>
      ) : null}
      {isAdmin ? (
        <section
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid var(--account-hairline-color, #e2e6e8)',
          }}
        >
          <h2 className={styles.title} style={{ fontSize: '1.1rem', marginBottom: 12 }}>
            {s.purgeTitle}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <input
              type="password"
              autoComplete="off"
              placeholder={s.purgePlaceholder}
              value={purgePassword}
              onChange={(e) => setPurgePassword(e.target.value)}
              style={{
                flex: '1 1 200px',
                maxWidth: 280,
                padding: '8px 12px',
                border: '1px solid var(--account-hairline-color, #e2e6e8)',
                fontSize: '0.9375rem',
              }}
            />
            <button
              type="button"
              disabled={purgeBusy}
              onClick={() => void runPurge()}
              style={{
                padding: '8px 16px',
                border: '1px solid #b42318',
                color: '#b42318',
                background: 'transparent',
                cursor: purgeBusy ? 'wait' : 'pointer',
                fontSize: '0.9375rem',
              }}
            >
              {purgeBusy ? s.purgeBusy : s.purgeBtn}
            </button>
          </div>
          {purgeMessage ? (
            <p className={styles.lead} style={{ marginTop: 12, color: '#051826' }}>
              {purgeMessage}
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
