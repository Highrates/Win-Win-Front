'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { adminBackendFetch } from '@/lib/adminBackendFetch';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import tabStyles from '../adminTabs.module.css';
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
  const [tab, setTab] = useState<TabKey>('designer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PartnerAppRow[]>([]);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionKind, setActionKind] = useState<'accept' | 'reject' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminBackendFetch('users/admin/partner-applications?skip=0&take=50', {
        method: 'GET',
      });
      if (!res.ok) {
        setError(designer.errLoad);
        return;
      }
      const j = (await res.json()) as { items: PartnerAppRow[]; total: number };
      setItems(Array.isArray(j.items) ? j.items : []);
      setTotal(typeof j.total === 'number' ? j.total : 0);
    } catch {
      setError(designer.errLoad);
    } finally {
      setLoading(false);
    }
  }, [designer.errLoad]);

  useEffect(() => {
    if (tab === 'designer') void load();
  }, [tab, load]);

  async function acceptUser(userId: string) {
    setActionId(userId);
    setActionKind('accept');
    setError(null);
    try {
      const res = await adminBackendFetch(`users/admin/partner-applications/${encodeURIComponent(userId)}/approve`, {
        method: 'POST',
        body: '{}',
      });
      if (!res.ok) {
        setError(designer.errAccept);
        return;
      }
      document.dispatchEvent(new Event('admin-partner-pending-refresh'));
      await load();
    } catch {
      setError(designer.errAccept);
    } finally {
      setActionId(null);
      setActionKind(null);
    }
  }

  async function rejectUser(userId: string) {
    if (!window.confirm(designer.rejectConfirm)) return;
    setActionId(userId);
    setActionKind('reject');
    setError(null);
    try {
      const res = await adminBackendFetch(`users/admin/partner-applications/${encodeURIComponent(userId)}/reject`, {
        method: 'POST',
        body: '{}',
      });
      if (!res.ok) {
        setError(designer.errReject);
        return;
      }
      document.dispatchEvent(new Event('admin-partner-pending-refresh'));
      await load();
    } catch {
      setError(designer.errReject);
    } finally {
      setActionId(null);
      setActionKind(null);
    }
  }

  return (
    <main className={`${tabStyles.panel} ${appStyles.root}`}>
      <h1>{title}</h1>
      <div className={tabStyles.tabs} role="tablist" aria-label={title}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'designer'}
          className={`${tabStyles.tabBtn} ${tab === 'designer' ? tabStyles.tabBtnActive : ''}`}
          onClick={() => setTab('designer')}
        >
          {labels.designer}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'payouts'}
          className={`${tabStyles.tabBtn} ${tab === 'payouts' ? tabStyles.tabBtnActive : ''}`}
          onClick={() => setTab('payouts')}
        >
          {labels.payouts}
        </button>
      </div>

      {tab === 'designer' ? (
        <section aria-label={labels.designer}>
          {error ? (
            <p className={catalogStyles.error} role="alert" style={{ marginTop: 8 }}>
              {error}
            </p>
          ) : null}
          {loading ? <p className={catalogStyles.muted}>{designer.loading}</p> : null}
          {!loading && !items.length ? <p className={catalogStyles.muted}>{designer.empty}</p> : null}
          {!loading && items.length > 0 ? (
            <div className={appStyles.tableWrap}>
              <table className={`${catalogStyles.table} ${appStyles.table}`}>
                <thead>
                  <tr>
                    <th>{designer.thEmail}</th>
                    <th>{designer.thName}</th>
                    <th>{designer.thSubmitted}</th>
                    <th>{designer.thRef}</th>
                    <th>{designer.thCv}</th>
                    <th>{designer.thActions}</th>
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
                        <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                          <div className={appStyles.rowActions}>
                            <Link
                              href={`/admin/clients/${encodeURIComponent(row.id)}`}
                              className={catalogStyles.backLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {designer.openClient}
                            </Link>
                            <button
                              type="button"
                              className={catalogStyles.btn}
                              disabled={actionId === row.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void acceptUser(row.id);
                              }}
                            >
                              {actionId === row.id && actionKind === 'accept' ? '…' : designer.accept}
                            </button>
                            <button
                              type="button"
                              className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                              disabled={actionId === row.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void rejectUser(row.id);
                              }}
                            >
                              {actionId === row.id && actionKind === 'reject' ? '…' : designer.reject}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
          {!loading && total > items.length ? (
            <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
              Всего: {total}
            </p>
          ) : null}
        </section>
      ) : null}
      {tab === 'payouts' ? (
        <section aria-labelledby="applications-tab-payouts">
          <p id="applications-tab-payouts" className={tabStyles.lead}>
            {leads.payouts}
          </p>
        </section>
      ) : null}
    </main>
  );
}
