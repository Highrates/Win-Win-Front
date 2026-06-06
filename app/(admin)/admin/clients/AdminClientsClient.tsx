'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { ADMIN_LIST_DEFAULT_LIMIT, adminSkipTakeParams, type AdminListResponse } from '@/lib/adminListResponse';
import { adminClientsStrings } from '@/lib/admin-i18n/adminClientsI18n';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import {
  adminQueryKeys,
  useAdminList,
  useAdminListSearch,
} from '@/lib/adminQuery';
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

type ClientsListData = AdminListResponse<Row> & { designerTotal: number };

export function AdminClientsClient() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminClientsStrings(locale), [locale]);
  const c = useMemo(() => adminCommonI18n(locale), [locale]);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const { q, setQ, debouncedQ, page, setPage } = useAdminListSearch();

  const { rows: items, total, data, loading, isFetching, error, refetch } = useAdminList<Row, ClientsListData>({
    queryKey: adminQueryKeys.clients.list({ q: debouncedQ, page }),
    page,
    q: debouncedQ,
    paramsMode: 'skipTake',
    errorFallback: s.errLoadList,
    loginRequired: s.loginRequired,
    queryFn: async () => {
      const json = await adminBackendJson<{
        items: Row[];
        total: number;
        designerTotal?: number;
      }>(`users/admin?${adminSkipTakeParams({ page, q: debouncedQ })}`);
      return {
        items: json.items ?? [],
        total: json.total ?? 0,
        designerTotal: typeof json.designerTotal === 'number' ? json.designerTotal : 0,
        page,
        limit: ADMIN_LIST_DEFAULT_LIMIT,
      };
    },
  });

  const designerTotal = data?.designerTotal ?? 0;

  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          {s.backAdmin}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>{s.pageTitle}</h1>
      <p className={catalogStyles.lead}>{s.pageLead({ total, designers: designerTotal })}</p>

      <AdminListShell
        loading={loading}
        error={error}
        onRetry={() => void refetch()}
        loadingLabel={c.loading}
        empty={s.emptyTable}
        isEmpty={!loading && !error && items.length === 0}
        isFetching={isFetching}
        styles={catalogStyles}
        toolbar={
          <div className={catalogStyles.toolbar}>
            <AdminSearchBox
              className={catalogStyles.searchBoxToolbar}
              placeholder={s.searchPlaceholder}
              ariaLabel={s.searchAria}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        }
        pagination={
          !loading && !error ? (
            <AdminListPagination
              page={page}
              total={total}
              limit={ADMIN_LIST_DEFAULT_LIMIT}
              onPageChange={setPage}
              disabled={isFetching}
            />
          ) : null
        }
      >
        <table className={catalogStyles.table}>
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
            {items.map((u) => {
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
            })}
          </tbody>
        </table>
      </AdminListShell>
    </main>
  );
}
