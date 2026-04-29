'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { adminClientDetailStrings } from '@/lib/admin-i18n/adminClientDetailI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import objTabStyles from '../../objects/objectsLibrary.module.css';
import styles from '../clients.module.css';

const TAB_ORDERS = 0;
const TAB_INFO = 1;
const TAB_CONSENTS = 2;
const TAB_STRUCTURE = 3;
const TAB_CASES = 4;

type UserDetail = {
  id: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  consentPersonalDataAcceptedAt: string | null;
  consentSmsMarketingAcceptedAt: string | null;
  designer?: { slug: string; isPublic: boolean } | null;
  profile: null | {
    firstName: string | null;
    lastName: string | null;
    city: string | null;
    services: unknown;
    aboutHtml: string | null;
    coverLayout: string | null;
    coverImageUrls: unknown;
    avatarUrl: string | null;
    winWinPartnerApproved?: boolean;
    winWinReferralCode?: string | null;
  };
};

type AdminCaseRow = {
  id: string;
  title: string;
  shortDescription: string | null;
  coverImageUrls: unknown;
  roomTypes: unknown;
  createdAt: string;
};

function parseStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
    .slice(0, max);
}

function formatCaseRoomTypes(roomTypes: unknown): string {
  const list = parseStringArray(roomTypes, 8);
  return list.length ? list.join(', ') : '—';
}

function formatCaseCoverPreview(coverImageUrls: unknown): string | null {
  const u = parseStringArray(coverImageUrls, 1);
  return u[0] ?? null;
}

type StructureL2 = {
  id: string;
  userId: string;
  email: string | null;
  name: string;
  isPartner: boolean;
  joinedAt: string;
};
type StructureL1 = {
  id: string;
  userId: string;
  email: string | null;
  name: string;
  isPartner: boolean;
  joinedAt: string;
  l2: StructureL2[];
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
  const [structure, setStructure] = useState<StructureL1[] | null>(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [inviter, setInviter] = useState<null | {
    referrerId: string;
    email: string | null;
    name: string;
    winWinReferralCode: string | null;
    joinedAt: string;
  }>(null);
  const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>({});

  const [cases, setCases] = useState<AdminCaseRow[] | null>(null);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);

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

  const isPartner = Boolean(data?.profile?.winWinPartnerApproved);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isPartner && tab === TAB_STRUCTURE) {
      setTab(TAB_ORDERS);
    }
  }, [isPartner, tab]);

  useEffect(() => {
    if (tab !== TAB_STRUCTURE || !isPartner) {
      return;
    }
    let cancelled = false;
    setStructureLoading(true);
    setStructureError(null);
    void (async () => {
      try {
        const invRes = await fetch(
          `/api/admin/backend/users/admin/${encodeURIComponent(id)}/winwin-inviter`,
          { credentials: 'same-origin', cache: 'no-store' },
        );
        if (!cancelled) {
          const inv = (await invRes.json().catch(() => null)) as null | {
            referrerId: string;
            email: string | null;
            name: string;
            winWinReferralCode: string | null;
            joinedAt: string;
          };
          setInviter(invRes.ok ? inv : null);
        }
        const res = await fetch(
          `/api/admin/backend/users/admin/${encodeURIComponent(id)}/referral-structure`,
          { credentials: 'same-origin', cache: 'no-store' },
        );
        if (!res.ok) {
          if (!cancelled) {
            setStructureError(s.errStatus(res.status));
            setStructure(null);
          }
          return;
        }
        const j = (await res.json()) as { l1?: StructureL1[] };
        if (!cancelled) {
          const next = Array.isArray(j.l1) ? j.l1 : [];
          setStructure(next);
          setExpandedL1((prev) => {
            const out: Record<string, boolean> = { ...prev };
            for (const row of next) {
              if (out[row.id] === undefined) out[row.id] = true;
            }
            return out;
          });
        }
      } catch {
        if (!cancelled) {
          setStructureError(s.errLoad);
          setStructure(null);
        }
      } finally {
        if (!cancelled) setStructureLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, id, isPartner, s.errLoad, s.errStatus]);

  useEffect(() => {
    if (tab !== TAB_CASES) return;
    let cancelled = false;
    setCasesLoading(true);
    setCasesError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/backend/cases/admin/users/${encodeURIComponent(id)}`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled) {
            setCasesError(res.status === 404 ? s.userNotFound : s.errStatus(res.status));
            setCases(null);
          }
          return;
        }
        const j = (await res.json()) as unknown;
        const list = Array.isArray(j) ? (j as AdminCaseRow[]) : [];
        if (!cancelled) setCases(list);
      } catch {
        if (!cancelled) {
          setCasesError(s.errLoad);
          setCases(null);
        }
      } finally {
        if (!cancelled) setCasesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, id, s]);

  const name = useMemo(() => {
    if (!data?.profile) return '—';
    if (!data.profile.firstName && !data.profile.lastName) return '—';
    return [data.profile.firstName, data.profile.lastName].filter(Boolean).join(' ') || '—';
  }, [data]);

  const formatStructureJoined = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '—';
      return d.toLocaleString(consLocale === 'zh' ? 'zh-CN' : 'ru-RU', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return '—';
    }
  };

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
            <button
              type="button"
              role="tab"
              aria-selected={tab === TAB_CASES}
              className={`${objTabStyles.mainScopeTab} ${tab === TAB_CASES ? objTabStyles.mainScopeTabActive : ''}`}
              onClick={() => setTab(TAB_CASES)}
            >
              {s.tabCases}
            </button>
            {isPartner ? (
              <button
                type="button"
                role="tab"
                aria-selected={tab === TAB_STRUCTURE}
                className={`${objTabStyles.mainScopeTab} ${tab === TAB_STRUCTURE ? objTabStyles.mainScopeTabActive : ''}`}
                onClick={() => setTab(TAB_STRUCTURE)}
              >
                {s.tabStructure}
              </button>
            ) : null}
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
                  <dt>{s.dtStatus}</dt>
                  <dd>{isPartner ? s.statusPartner : s.statusDefault}</dd>
                </div>
                {isPartner ? (
                  <div>
                    <dt>{s.dtReferralCode}</dt>
                    <dd>{data.profile?.winWinReferralCode?.trim() ? data.profile.winWinReferralCode : '—'}</dd>
                  </div>
                ) : null}
                {isPartner ? (
                  <div>
                    <dt>{s.dtPublication}</dt>
                    <dd>{data.designer?.isPublic === true ? s.partnerYes : s.partnerNo}</dd>
                  </div>
                ) : null}
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
          {tab === TAB_CASES ? (
            <section className={styles.tabPanel} aria-label={s.tabCases}>
              {casesError ? (
                <p className={styles.error} role="alert">
                  {casesError}
                </p>
              ) : null}
              {casesLoading ? <p className={catalogStyles.muted}>{s.loading}</p> : null}
              {!casesLoading && !casesError && cases && cases.length === 0 ? (
                <p className={catalogStyles.muted}>Пока нет кейсов</p>
              ) : null}
              {!casesLoading && !casesError && cases && cases.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className={catalogStyles.table}>
                    <thead>
                      <tr>
                        <th>Обложка</th>
                        <th>Название</th>
                        <th>Помещения</th>
                        <th>Создан</th>
                        <th style={{ width: 120 }}>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map((c) => {
                        const cover = formatCaseCoverPreview(c.coverImageUrls);
                        return (
                          <tr key={c.id}>
                            <td>
                              {cover ? (
                                <a href={cover} target="_blank" rel="noreferrer">
                                  <img
                                    src={cover}
                                    alt=""
                                    style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 6 }}
                                    loading="lazy"
                                  />
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <Link
                                href={`/admin/clients/${encodeURIComponent(id)}/cases/${encodeURIComponent(c.id)}`}
                                className={styles.caseTitleLink}
                              >
                                {c.title}
                              </Link>
                              {c.shortDescription?.trim() ? (
                                <div className={catalogStyles.muted} style={{ marginTop: 2 }}>
                                  {c.shortDescription}
                                </div>
                              ) : null}
                            </td>
                            <td>{formatCaseRoomTypes(c.roomTypes)}</td>
                            <td>{formatConsentAt(c.createdAt, '—', consLocale)}</td>
                            <td>
                              <button
                                type="button"
                                className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                                disabled={deletingCaseId === c.id}
                                onClick={() => {
                                  if (!confirm('Удалить кейс?')) return;
                                  setDeletingCaseId(c.id);
                                  setCasesError(null);
                                  void (async () => {
                                    try {
                                      const res = await fetch(
                                        `/api/admin/backend/cases/admin/${encodeURIComponent(c.id)}`,
                                        { method: 'DELETE', credentials: 'same-origin' },
                                      );
                                      if (!res.ok) {
                                        setCasesError(s.errStatus(res.status));
                                        return;
                                      }
                                      setCases((prev) => (prev ? prev.filter((x) => x.id !== c.id) : prev));
                                    } catch {
                                      setCasesError(s.errLoad);
                                    } finally {
                                      setDeletingCaseId(null);
                                    }
                                  })();
                                }}
                              >
                                {deletingCaseId === c.id ? 'Удаление…' : 'Удалить'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ) : null}
          {tab === TAB_STRUCTURE && isPartner ? (
            <section className={styles.tabPanel} aria-label={s.tabStructure}>
              {inviter ? (
                <p className={catalogStyles.muted} style={{ marginTop: 0, marginBottom: 12 }}>
                  Пригласил:{' '}
                  <Link
                    href={`/admin/clients/${encodeURIComponent(inviter.referrerId)}`}
                    className={catalogStyles.backLink}
                  >
                    {inviter.name}
                  </Link>
                  {inviter.winWinReferralCode?.trim() ? ` (${inviter.winWinReferralCode.trim()})` : ''}
                </p>
              ) : null}
              {structureError ? (
                <p className={styles.error} role="alert">
                  {structureError}
                </p>
              ) : null}
              {structureLoading ? <p className={catalogStyles.muted}>{s.loading}</p> : null}
              {!structureLoading && !structureError && structure && !structure.length ? (
                <p className={catalogStyles.muted}>{s.structureEmpty}</p>
              ) : null}
              {!structureLoading && structure && structure.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className={catalogStyles.table}>
                    <thead>
                      <tr>
                        <th>{s.thLevel}</th>
                        <th>{s.thUser}</th>
                        <th>{s.thEmail}</th>
                        <th>{s.thJoined}</th>
                        <th>{s.thPartnerCol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structure.map((l1) => (
                        <Fragment key={l1.id}>
                          <tr>
                            <td>
                              {l1.l2.length ? (
                                <button
                                  type="button"
                                  className={catalogStyles.backLink}
                                  onClick={() =>
                                    setExpandedL1((p) => ({ ...p, [l1.id]: !(p[l1.id] ?? true) }))
                                  }
                                  aria-expanded={expandedL1[l1.id] ?? true}
                                  title="Показать/скрыть L2"
                                >
                                  {(expandedL1[l1.id] ?? true) ? '▾ ' : '▸ '}
                                  {s.levelL1}
                                </button>
                              ) : (
                                s.levelL1
                              )}
                            </td>
                            <td>
                              <Link
                                href={`/admin/clients/${encodeURIComponent(l1.userId)}`}
                                className={catalogStyles.backLink}
                              >
                                {l1.name}
                              </Link>
                            </td>
                            <td>{l1.email ?? '—'}</td>
                            <td>{formatStructureJoined(l1.joinedAt)}</td>
                            <td>{l1.isPartner ? s.partnerYes : s.partnerNo}</td>
                          </tr>
                          {(expandedL1[l1.id] ?? true)
                            ? l1.l2.map((l2) => (
                                <tr key={l2.id} className={styles.structureL2Row}>
                                  <td>{s.levelL2}</td>
                                  <td>
                                    <Link
                                      href={`/admin/clients/${encodeURIComponent(l2.userId)}`}
                                      className={catalogStyles.backLink}
                                    >
                                      {l2.name}
                                    </Link>
                                  </td>
                                  <td>{l2.email ?? '—'}</td>
                                  <td>{formatStructureJoined(l2.joinedAt)}</td>
                                  <td>{l2.isPartner ? s.partnerYes : s.partnerNo}</td>
                                </tr>
                              ))
                            : null}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
