'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { ADMIN_LIST_DEFAULT_LIMIT, adminSkipTakeParams } from '@/lib/adminListResponse';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import {
  adminQueryErrorFromBackend,
  adminQueryKeys,
  useAdminList,
  useAdminListSearch,
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import { AdminTabs, AdminTabsLead, AdminTabsPanel } from '@/components/AdminTabs/AdminTabs';
import appStyles from './applications.module.css';

type TabKey = 'designer' | 'payouts';

type DesignerTableCopy = {
  loading: string;
  empty: string;
  thEmail: string;
  thName: string;
  thSubmitted: string;
  thRef: string;
  thCv: string;
  rowGoToApplication: string;
  thActions: string;
  openCv: string;
  accept: string;
  reject: string;
  rejectConfirm: string;
  openClient: string;
  errLoad: string;
  errAccept: string;
  errReject: string;
};

type PartnerAppRow = {
  id: string;
  email: string | null;
  profile: null | {
    firstName: string | null;
    lastName: string | null;
    partnerApplicationSubmittedAt: string | null;
    partnerApplicationReferralCode: string | null;
    partnerApplicationCvUrl: string | null;
  };
};

type PartnerListData = {
  items: PartnerAppRow[];
  total: number;
  page: number;
  limit: number;
};

function formatName(p: PartnerAppRow['profile']): string {
  if (!p) return '—';
  const t = [p.firstName, p.lastName].filter((x) => x && String(x).trim()).join(' ').trim();
  return t || '—';
}

function formatAt(iso: string | null | undefined, loc: 'ru' | 'zh') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(loc === 'zh' ? 'zh-CN' : 'ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

export function ApplicationsAdminClient({
  title,
  labels,
  leads,
  designer,
}: {
  title: string;
  labels: { designer: string; payouts: string };
  leads: { designer: string; payouts: string };
  designer: DesignerTableCopy;
}) {
  const router = useRouter();
  const { locale: adminLoc } = useAdminLocale();
  const consLocale: 'ru' | 'zh' = adminLoc === 'zh' ? 'zh' : 'ru';
  const invalidate = useInvalidateAdminQueries();
  const { confirm } = useAdminConfirm();
  const [tab, setTab] = useState<TabKey>('designer');
  const { page, setPage } = useAdminListSearch();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionKind, setActionKind] = useState<'accept' | 'reject' | null>(null);

  const { rows: items, total, loading, isFetching, error: listError, refetch } = useAdminList<PartnerAppRow>({
    queryKey: adminQueryKeys.applications.partnerList(page),
    page,
    paramsMode: 'skipTake',
    errorFallback: designer.errLoad,
    enabled: tab === 'designer',
    queryFn: async () => {
      const j = await adminBackendJson<{ items: PartnerAppRow[]; total: number }>(
        `users/admin/partner-applications?${adminSkipTakeParams({ page })}`,
      );
      return {
        items: Array.isArray(j.items) ? j.items : [],
        total: typeof j.total === 'number' ? j.total : 0,
        page,
        limit: ADMIN_LIST_DEFAULT_LIMIT,
      };
    },
  });

  const error = mutationError ?? listError;

  async function acceptUser(userId: string) {
    setActionId(userId);
    setActionKind('accept');
    setMutationError(null);
    try {
      await adminBackendJson(
        `users/admin/partner-applications/${encodeURIComponent(userId)}/approve`,
        { method: 'POST', body: '{}' },
      );
      document.dispatchEvent(new Event('admin-partner-pending-refresh'));
      await invalidate(adminQueryKeys.applications.all);
    } catch (e) {
      setMutationError(adminQueryErrorFromBackend(e, designer.errAccept));
    } finally {
      setActionId(null);
      setActionKind(null);
    }
  }

  async function rejectUser(userId: string) {
    if (!(await confirm({ title: designer.rejectConfirm, confirmLabel: designer.reject }))) return;
    setActionId(userId);
    setActionKind('reject');
    setMutationError(null);
    try {
      await adminBackendJson(
        `users/admin/partner-applications/${encodeURIComponent(userId)}/reject`,
        { method: 'POST', body: '{}' },
      );
      document.dispatchEvent(new Event('admin-partner-pending-refresh'));
      await invalidate(adminQueryKeys.applications.all);
    } catch (e) {
      setMutationError(adminQueryErrorFromBackend(e, designer.errReject));
    } finally {
      setActionId(null);
      setActionKind(null);
    }
  }

  return (
      <AdminTabsPanel as="main" className={appStyles.root}>
      <h1 className={catalogStyles.title}>{title}</h1>
      <AdminTabs
        compact
        ariaLabel={title}
        items={[
          { id: 'designer' as const, label: labels.designer },
          { id: 'payouts' as const, label: labels.payouts },
        ]}
        activeId={tab}
        onChange={setTab}
      />

      {tab === 'designer' ? (
        <section aria-label={labels.designer}>
          <AdminListShell
            loading={loading}
            error={error}
            onRetry={() => void refetch()}
            loadingLabel={designer.loading}
            empty={designer.empty}
            isEmpty={!loading && !error && items.length === 0}
            isFetching={isFetching}
            styles={catalogStyles}
            pagination={
              !loading ? (
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
            <table className={`${catalogStyles.table} ${appStyles.tableMin}`}>
                <thead>
                  <tr>
                    <th>{designer.thEmail}</th>
                    <th>{designer.thName}</th>
                    <th>{designer.thSubmitted}</th>
                    <th>{designer.thRef}</th>
                    <th>{designer.thCv}</th>
                    <th className={catalogStyles.tableCellActions}>{designer.thActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const cv = row.profile?.partnerApplicationCvUrl;
                    return (
                      <tr
                        key={row.id}
                        className={appStyles.clickableRow}
                        onClick={() => router.push(`/admin/applications/${encodeURIComponent(row.id)}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/admin/applications/${encodeURIComponent(row.id)}`);
                          }
                        }}
                        tabIndex={0}
                        aria-label={designer.rowGoToApplication}
                      >
                        <td>{row.email ?? '—'}</td>
                        <td>{formatName(row.profile)}</td>
                        <td>{formatAt(row.profile?.partnerApplicationSubmittedAt, consLocale)}</td>
                        <td>{row.profile?.partnerApplicationReferralCode?.trim() || '—'}</td>
                        <td
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {cv ? (
                            <a href={cv} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                              {designer.openCv}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td
                          className={catalogStyles.tableCellActions}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <div className={appStyles.rowActions}>
                            <Link
                              href={`/admin/clients/${encodeURIComponent(row.id)}`}
                              className={catalogStyles.backLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {designer.openClient}
                            </Link>
                            <AdminCompactBtn
                              type="button"
                              variant="accent"
                              disabled={actionId === row.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void acceptUser(row.id);
                              }}
                            >
                              {actionId === row.id && actionKind === 'accept' ? '…' : designer.accept}
                            </AdminCompactBtn>
                            <AdminCompactBtn
                              type="button"
                              variant="danger"
                              disabled={actionId === row.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void rejectUser(row.id);
                              }}
                            >
                              {actionId === row.id && actionKind === 'reject' ? '…' : designer.reject}
                            </AdminCompactBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </AdminListShell>
        </section>
      ) : null}
      {tab === 'payouts' ? (
        <section aria-labelledby="applications-tab-payouts">
          <AdminTabsLead id="applications-tab-payouts">{leads.payouts}</AdminTabsLead>
        </section>
      ) : null}
    </AdminTabsPanel>
  );
}
