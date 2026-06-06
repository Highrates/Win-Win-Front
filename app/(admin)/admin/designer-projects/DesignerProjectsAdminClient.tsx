'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminDesignerProjectsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminQueryKeys, useAdminList, useAdminListSearch } from '@/lib/adminQuery';
import catalogStyles from '../catalog/catalogAdmin.module.css';
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
  embedded?: boolean;
  filterUserId?: string;
}) {
  const { locale } = useAdminLocale();
  const misc = useMemo(() => adminDesignerProjectsPage(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const shellStyles = embedded ? catalogStyles : styles;

  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch(350, [filterUserId]);
  const limit = 20;
  const hideUserColumn = Boolean(filterUserId);

  const listParams = useMemo(
    () => ({
      page,
      q: debouncedQ,
      userId: filterUserId || undefined,
    }),
    [page, debouncedQ, filterUserId],
  );

  const { rows: items, total, loading, isFetching, error, refetch } = useAdminList<Row>({
    queryKey: adminQueryKeys.designerProjects.list(listParams),
    page,
    q: debouncedQ,
    limit,
    errorFallback: c.errLoad,
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedQ) qs.set('q', debouncedQ);
      if (filterUserId) qs.set('userId', filterUserId);
      const data = await adminBackendJson<{ total: number; items: Row[] }>(`designer-projects/admin?${qs}`);
      return {
        items: data.items ?? [],
        total: data.total ?? 0,
        page,
        limit,
      };
    },
  });

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className={embedded ? styles.panelEmbedded : styles.panel}>
      {embedded ? null : (
        <>
          <h1 className={catalogStyles.title}>{title}</h1>
          <p className={styles.lead}>{lead}</p>
        </>
      )}

      <AdminListShell
        loading={loading}
        error={error}
        onRetry={() => void refetch()}
        loadingLabel={loadingLabel}
        empty={empty}
        isEmpty={!loading && !error && items.length === 0}
        isFetching={isFetching}
        styles={shellStyles}
        toolbar={
          <div className={embedded ? catalogStyles.toolbar : styles.toolbar}>
            <AdminSearchBox
              className={embedded ? catalogStyles.searchBoxToolbar : styles.searchBoxToolbar}
              placeholder={searchPlaceholder}
              ariaLabel={searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        }
        pagination={
          embedded && filterUserId ? null : items.length > 0 ? (
            <div
              className={embedded ? catalogStyles.toolbar : styles.pagination}
              style={embedded ? { marginTop: 16 } : undefined}
            >
              <AdminCompactBtn
                type="button"
                variant="outline"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {prev}
              </AdminCompactBtn>
              <span className={embedded ? catalogStyles.mutedInline : undefined}>{misc.pageOf(page, pages)}</span>
              <AdminCompactBtn
                type="button"
                variant="outline"
                disabled={page >= pages || isFetching}
                onClick={() => setPage((p) => (p < pages ? p + 1 : p))}
              >
                {next}
              </AdminCompactBtn>
            </div>
          ) : null
        }
      >
        <table className={embedded ? catalogStyles.table : styles.table}>
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
      </AdminListShell>
    </main>
  );
}
