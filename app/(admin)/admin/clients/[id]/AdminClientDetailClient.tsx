'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminClientDetailStrings } from '@/lib/admin-i18n/adminClientDetailI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import objTabStyles from '../../objects/objectsLibrary.module.css';
import styles from '../clients.module.css';

const TAB_ORDERS = 0;
const TAB_INFO = 1;
const TAB_CONSENTS = 2;

type UserDetail = {
  id: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  consentPersonalDataAcceptedAt: string | null;
  consentSmsMarketingAcceptedAt: string | null;
  profile: null | {
    firstName: string | null;
    lastName: string | null;
    city: string | null;
    services: unknown;
    aboutHtml: string | null;
    coverLayout: string | null;
    coverImageUrls: unknown;
    avatarUrl: string | null;
  };
};

function formatServices(services: unknown): string {
  if (!Array.isArray(services)) return '—';
  const t = services.filter((x): x is string => typeof x === 'string');
  return t.length ? t.join(', ') : '—';
}

function formatCoverUrls(coverImageUrls: unknown): string[] {
  if (!Array.isArray(coverImageUrls)) return [];
  return coverImageUrls.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

function formatConsentAt(iso: string | null | undefined, no: string, locale: 'ru' | 'zh') {
  if (!iso) return no;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return no;
    return d.toLocaleString(locale === 'zh' ? 'zh-CN' : 'ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return no;
  }
}

export function AdminClientDetailClient({ id }: { id: string }) {
  const { locale: adminLoc } = useAdminLocale();
  const s = useMemo(() => adminClientDetailStrings(adminLoc), [adminLoc]);
  const consLocale: 'ru' | 'zh' = adminLoc === 'zh' ? 'zh' : 'ru';
  const [data, setData] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB_ORDERS);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/backend/users/admin/${encodeURIComponent(id)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) {
        setError(res.status === 404 ? s.userNotFound : s.errStatus(res.status));
        setData(null);
        return;
      }
      setData((await res.json()) as UserDetail);
    } catch {
      setError(s.errLoad);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, s]);

  useEffect(() => {
    void load();
  }, [load]);

  const name = useMemo(() => {
    if (!data?.profile) return '—';
    if (!data.profile.firstName && !data.profile.lastName) return '—';
    return [data.profile.firstName, data.profile.lastName].filter(Boolean).join(' ') || '—';
  }, [data]);

  const coverUrls = formatCoverUrls(data?.profile?.coverImageUrls);
  const titleText = useMemo(() => {
    if (!data) return s.clientTitle;
    const phone = (data.phone ?? '—').trim() || '—';
    const email = (data.email ?? '—').trim() || '—';
    return s.titleWithContacts(phone, email);
  }, [data, s]);

  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin/clients" className={catalogStyles.backLink}>
          {s.backList}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>{!loading && !error && data ? titleText : s.clientTitle}</h1>
      {loading ? <p className={catalogStyles.lead}>{s.loading}</p> : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && data ? (
        <>
          <div className={objTabStyles.mainScopeTabs} role="tablist" aria-label={s.tabsAria}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === TAB_ORDERS}
              className={`${objTabStyles.mainScopeTab} ${tab === TAB_ORDERS ? objTabStyles.mainScopeTabActive : ''}`}
              onClick={() => setTab(TAB_ORDERS)}
            >
              {s.tabOrders}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === TAB_INFO}
              className={`${objTabStyles.mainScopeTab} ${tab === TAB_INFO ? objTabStyles.mainScopeTabActive : ''}`}
              onClick={() => setTab(TAB_INFO)}
            >
              {s.tabInfo}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === TAB_CONSENTS}
              className={`${objTabStyles.mainScopeTab} ${tab === TAB_CONSENTS ? objTabStyles.mainScopeTabActive : ''}`}
              onClick={() => setTab(TAB_CONSENTS)}
            >
              {s.tabConsents}
            </button>
          </div>
          {tab === TAB_ORDERS ? (
            <section className={styles.tabPanel} aria-label={s.tabOrders}>
              <p className={catalogStyles.muted}>{s.ordersEmpty}</p>
            </section>
          ) : null}
          {tab === TAB_INFO ? (
            <section className={styles.tabPanel} aria-label={s.tabInfo}>
              <dl className={styles.detailList}>
                <div>
                  <dt>ID</dt>
                  <dd>{data.id}</dd>
                </div>
                <div>
                  <dt>{s.dtEmail}</dt>
                  <dd>{data.email ?? '—'}</dd>
                </div>
                <div>
                  <dt>{s.dtPhone}</dt>
                  <dd>{data.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt>{s.dtName}</dt>
                  <dd>{name}</dd>
                </div>
                <div>
                  <dt>{s.dtCity}</dt>
                  <dd>{data.profile?.city?.trim() ? data.profile.city : '—'}</dd>
                </div>
                <div>
                  <dt>{s.dtServices}</dt>
                  <dd>{formatServices(data.profile?.services)}</dd>
                </div>
                <div>
                  <dt>{s.dtAvatar}</dt>
                  <dd>
                    {data.profile?.avatarUrl ? (
                      <a href={data.profile.avatarUrl} target="_blank" rel="noreferrer">
                        {s.linkOpen}
                      </a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{s.dtCoverUrls}</dt>
                  <dd>
                    {coverUrls.length ? (
                      <ul className={styles.urlList}>
                        {coverUrls.map((u) => (
                          <li key={u}>
                            <a href={u} target="_blank" rel="noreferrer">
                              {s.linkOpen}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{s.dtAboutTitle}</dt>
                  <dd className={styles.htmlCell}>
                    {data.profile?.aboutHtml?.trim() ? (
                      <div
                        className={`rich-content ${styles.aboutHtml}`}
                        dangerouslySetInnerHTML={{ __html: data.profile.aboutHtml }}
                      />
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}
          {tab === TAB_CONSENTS ? (
            <section className={styles.tabPanel} aria-label={s.tabConsents}>
              <p className={catalogStyles.muted} style={{ marginTop: 0, marginBottom: 16, maxWidth: 52 * 8 }}>
                {s.consentsTabLead}
              </p>
              <dl className={styles.detailList}>
                <div>
                  <dt>{s.dtConsentPersonal}</dt>
                  <dd>
                    {data.consentPersonalDataAcceptedAt
                      ? `${s.consentYes} — ${formatConsentAt(data.consentPersonalDataAcceptedAt, s.consentNo, consLocale)}`
                      : s.consentNo}
                  </dd>
                </div>
                <div>
                  <dt>{s.dtConsentSms}</dt>
                  <dd>
                    {data.consentSmsMarketingAcceptedAt
                      ? `${s.consentYes} — ${formatConsentAt(data.consentSmsMarketingAcceptedAt, s.consentNo, consLocale)}`
                      : s.consentNo}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
