'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { adminClientDetailStrings } from '@/lib/admin-i18n/adminClientDetailI18n';
import { adminDesignerProjectsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import { adminDetailErrorFromBackend } from '@/lib/adminQuery';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import styles from '../clients.module.css';
import { DesignerProjectsAdminClient } from '../../designer-projects/DesignerProjectsAdminClient';
import { OrdersAdminClient } from '../../orders/OrdersAdminClient';
import { parseApiCaseList, roomTypesCommaSeparated, type ApiCase } from '@/lib/account/caseApiSchema';
import type { UserGroupMembership, UserGroupRow } from '@/lib/adminUserGroupsTypes';

const TAB_ORDERS = 0;
const TAB_INFO = 1;
const TAB_CONSENTS = 2;
const TAB_STRUCTURE = 3;
const TAB_CASES = 4;

const TAB_PROJECTS = 5;

type UserDetail = {
  id: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  consentPersonalDataAcceptedAt: string | null;
  consentSmsMarketingAcceptedAt: string | null;
  designer?: { slug: string; isPublic: boolean; likesUserCount?: number } | null;
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

type InviterPayload = {
  referrerId: string;
  email: string | null;
  name: string;
  winWinReferralCode: string | null;
  joinedAt: string;
};

export function AdminClientDetailClient({ id }: { id: string }) {
  const { locale: adminLoc } = useAdminLocale();
  const s = useMemo(() => adminClientDetailStrings(adminLoc), [adminLoc]);
  const consLocale: 'ru' | 'zh' = adminLoc === 'zh' ? 'zh' : 'ru';
  const projPage = useMemo(() => adminDesignerProjectsPage(adminLoc), [adminLoc]);
  const [data, setData] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB_ORDERS);
  const [structure, setStructure] = useState<StructureL1[] | null>(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [inviter, setInviter] = useState<InviterPayload | null>(null);
  const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>({});

  const [cases, setCases] = useState<ApiCase[] | null>(null);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<UserGroupRow[]>([]);
  const [groupMembership, setGroupMembership] = useState<UserGroupMembership | null>(null);
  const [groupSelect, setGroupSelect] = useState('');
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const { confirm } = useAdminConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminBackendJson<UserDetail>(`users/admin/${encodeURIComponent(id)}`));
    } catch (e) {
      setError(
        adminDetailErrorFromBackend(e, {
          fallback: s.errLoad,
          notFound: s.userNotFound,
          errStatus: s.errStatus,
        }),
      );
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
        let inv: InviterPayload | null = null;
        try {
          inv = await adminBackendJson<InviterPayload>(
            `users/admin/${encodeURIComponent(id)}/winwin-inviter`,
          );
        } catch {
          inv = null;
        }
        if (!cancelled) setInviter(inv);

        const j = await adminBackendJson<{ l1?: StructureL1[] }>(
          `users/admin/${encodeURIComponent(id)}/referral-structure`,
        );
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
      } catch (e) {
        if (!cancelled) {
          setStructureError(
            adminDetailErrorFromBackend(e, {
              fallback: s.errLoad,
              errStatus: s.errStatus,
            }),
          );
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
    if (tab !== TAB_INFO) return;
    let cancelled = false;
    setGroupError(null);
    void (async () => {
      try {
        const [groups, membership] = await Promise.all([
          adminBackendJson<UserGroupRow[]>('settings/admin/user-groups'),
          adminBackendJson<UserGroupMembership>(`users/admin/${encodeURIComponent(id)}/group`),
        ]);
        if (cancelled) return;
        setUserGroups(groups);
        setGroupMembership(membership);
        setGroupSelect(membership.groupId ?? '');
      } catch (e) {
        if (!cancelled) {
          setGroupError(e instanceof Error ? e.message : s.errLoad);
          setUserGroups([]);
          setGroupMembership(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, id, s.errLoad]);

  async function saveClientGroup() {
    setGroupSaving(true);
    setGroupError(null);
    try {
      const membership = await adminBackendJson<UserGroupMembership>(
        `users/admin/${encodeURIComponent(id)}/group`,
        {
          method: 'PUT',
          body: JSON.stringify({ groupId: groupSelect || null }),
        },
      );
      setGroupMembership(membership);
      setGroupSelect(membership.groupId ?? '');
    } catch (e) {
      setGroupError(e instanceof Error ? e.message : s.errLoad);
    } finally {
      setGroupSaving(false);
    }
  }

  useEffect(() => {
    if (tab !== TAB_CASES) return;
    let cancelled = false;
    setCasesLoading(true);
    setCasesError(null);
    void (async () => {
      try {
        const j = await adminBackendJson<unknown>(`cases/admin/users/${encodeURIComponent(id)}`);
        if (!cancelled) setCases(parseApiCaseList(j));
      } catch (e) {
        if (!cancelled) {
          setCasesError(
            adminDetailErrorFromBackend(e, {
              fallback: s.errLoad,
              notFound: s.userNotFound,
              errStatus: s.errStatus,
            }),
          );
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

  const clientTabItems = useMemo(() => {
    const items: { id: number; label: string }[] = [
      { id: TAB_ORDERS, label: s.tabOrders },
      { id: TAB_INFO, label: s.tabInfo },
      { id: TAB_CONSENTS, label: s.tabConsents },
      { id: TAB_CASES, label: s.tabCases },
      { id: TAB_PROJECTS, label: s.tabProjects },
    ];
    if (isPartner) {
      items.push({ id: TAB_STRUCTURE, label: s.tabStructure });
    }
    return items;
  }, [isPartner, s]);

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
        <p className={catalogStyles.error} role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && data ? (
        <>
          <AdminTabs
            compact
            ariaLabel={s.tabsAria}
            items={clientTabItems}
            activeId={tab}
            onChange={setTab}
          />
          {tab === TAB_ORDERS ? (
            <section className={styles.tabPanel} aria-label={s.tabOrders}>
              <OrdersAdminClient key={id} embedded filterUserId={id} />
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
                <div>
                  <dt>Группа пользователей</dt>
                  <dd>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
                      <select
                        value={groupSelect}
                        onChange={(e) => setGroupSelect(e.target.value)}
                        disabled={groupSaving}
                        style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
                      >
                        <option value="">Без группы (основные профили)</option>
                        {userGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.label})
                          </option>
                        ))}
                      </select>
                      {groupMembership?.groupLabel ? (
                        <span className={catalogStyles.muted}>
                          Текущий лейбл в ЛК: {groupMembership.groupLabel}
                        </span>
                      ) : null}
                      <AdminCompactBtn
                        type="button"
                        disabled={groupSaving}
                        onClick={() => void saveClientGroup()}
                      >
                        {groupSaving ? 'Сохранение…' : 'Сохранить группу'}
                      </AdminCompactBtn>
                      {groupError ? (
                        <span className={catalogStyles.error} role="alert">
                          {groupError}
                        </span>
                      ) : null}
                    </div>
                  </dd>
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
                {isPartner ? (
                  <div>
                    <dt>Лайки дизайнера</dt>
                    <dd>{Math.max(0, data.designer?.likesUserCount ?? 0)}</dd>
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
            <section className={`${styles.tabPanel} ${styles.tabPanelWide}`} aria-label={s.tabCases}>
              {casesError ? (
                <p className={catalogStyles.error} role="alert">
                  {casesError}
                </p>
              ) : null}
              {casesLoading ? <p className={catalogStyles.muted}>{s.loading}</p> : null}
              {!casesLoading && !casesError && cases && cases.length === 0 ? (
                <p className={catalogStyles.muted}>Пока нет кейсов</p>
              ) : null}
              {!casesLoading && !casesError && cases && cases.length > 0 ? (
                <div className={catalogStyles.tableWrap}>
                  <table className={catalogStyles.table}>
                    <thead>
                      <tr>
                        <th>Название</th>
                        <th>Помещения</th>
                        <th>Создан</th>
                        <th className={catalogStyles.tableCellActions}>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map((c) => {
                        return (
                          <tr key={c.id}>
                            <td>
                              <Link
                                href={`/admin/clients/${encodeURIComponent(id)}/cases/${encodeURIComponent(c.id)}`}
                                className={styles.caseTitleLink}
                              >
                                {c.title}
                              </Link>
                            </td>
                            <td>{roomTypesCommaSeparated(c.roomTypes) || '—'}</td>
                            <td>{formatConsentAt(c.createdAt, '—', consLocale)}</td>
                            <td className={catalogStyles.tableCellActions}>
                              <AdminCompactBtn
                                type="button"
                                variant="danger"
                                disabled={deletingCaseId === c.id}
                                onClick={() => {
                                  void (async () => {
                                    if (!(await confirm({ title: 'Удалить кейс?' }))) return;
                                    setDeletingCaseId(c.id);
                                    setCasesError(null);
                                    try {
                                      await adminBackendJson(
                                        `cases/admin/${encodeURIComponent(c.id)}`,
                                        { method: 'DELETE' },
                                      );
                                      setCases((prev) => (prev ? prev.filter((x) => x.id !== c.id) : prev));
                                    } catch (e) {
                                      setCasesError(
                                        adminDetailErrorFromBackend(e, {
                                          fallback: s.errLoad,
                                          errStatus: s.errStatus,
                                        }),
                                      );
                                    } finally {
                                      setDeletingCaseId(null);
                                    }
                                  })();
                                }}
                              >
                                {deletingCaseId === c.id ? 'Удаление…' : 'Удалить'}
                              </AdminCompactBtn>
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
          {tab === TAB_PROJECTS ? (
            <section className={styles.tabPanel} aria-label={s.tabProjects}>
              <DesignerProjectsAdminClient
                embedded
                filterUserId={id}
                title={projPage.title}
                lead={projPage.lead}
                searchPlaceholder={projPage.searchPlaceholder}
                thProject={projPage.thProject}
                thUser={projPage.thUser}
                thLines={projPage.thLines}
                thRooms={projPage.thRooms}
                thTotal={projPage.thTotal}
                thUpdated={projPage.thUpdated}
                empty={projPage.empty}
                loadingLabel={projPage.loading}
                prev={projPage.prev}
                next={projPage.next}
              />
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
                <p className={catalogStyles.error} role="alert">
                  {structureError}
                </p>
              ) : null}
              {structureLoading ? <p className={catalogStyles.muted}>{s.loading}</p> : null}
              {!structureLoading && !structureError && structure && !structure.length ? (
                <p className={catalogStyles.muted}>{s.structureEmpty}</p>
              ) : null}
              {!structureLoading && structure && structure.length > 0 ? (
                <div className={catalogStyles.tableWrap}>
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
                                  className={styles.structureExpandBtn}
                                  onClick={() =>
                                    setExpandedL1((p) => ({ ...p, [l1.id]: !(p[l1.id] ?? true) }))
                                  }
                                  aria-expanded={expandedL1[l1.id] ?? true}
                                  title="Показать/скрыть L2"
                                >
                                  <span className={styles.structureExpandIcon} aria-hidden>
                                    {(expandedL1[l1.id] ?? true) ? '▾' : '▸'}
                                  </span>
                                  {s.levelL1}
                                  <span className={catalogStyles.mutedInline}> ({l1.l2.length})</span>
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
