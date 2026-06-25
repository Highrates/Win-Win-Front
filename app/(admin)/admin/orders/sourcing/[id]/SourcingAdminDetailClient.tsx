'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn, AdminCompactBtnLink } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminSelect } from '@/components/AdminTextField/AdminTextField';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderDetailStrings, adminSourcingStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import { adminSourcingKpStrings } from '@/lib/admin-i18n/adminSourcingKpI18n';
import { formatAdminOrderDateTime } from '@/lib/dates/formatAdminOrderDateTime';
import { sourcingKpLineTotalRub, sourcingKpOrderTotalRub } from '@/lib/sourcingCommercialProposal/kpLineTotals';
import type { SourcingCommercialProposalApi, SourcingCommercialProposalSummaryApi } from '@/lib/sourcingCommercialProposal/types';
import {
  deleteAdminSourcingRequest,
  fetchAdminSourcingRequest,
  patchAdminSourcingRequestStatus,
} from '@/lib/userSourcingRequests/adminClientApi';
import { fetchSourcingKpSummary, fetchSourcingKpPublished } from '@/lib/userSourcingRequests/sourcingKpAdminApi';
import { sourcingStatusLabel } from '@/lib/userSourcingRequests/sourcingStatus';
import type { AdminSourcingRequestDetailApi, SourcingRequestStatus } from '@/lib/userSourcingRequests/types';
import styles from '../../../catalog/catalogAdmin.module.css';
import clientsStyles from '../../../clients/clients.module.css';
import pn from '../../../catalog/products/new/productNew.module.css';
import od from '../../[id]/orderAdminDetail.module.css';
import { AdminOrdersConfirmModal } from '../../AdminOrdersConfirmModal';
import { AdminSourcingSideChat } from './AdminSourcingSideChat';
import { AdminSourcingProductAccordion } from './AdminSourcingProductAccordion';

const ACTIVE_STATUS_OPTIONS: SourcingRequestStatus[] = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function notifyAdminSourcingPendingRefresh() {
  document.dispatchEvent(new Event('admin-sourcing-pending-refresh'));
}

function accountDisplayName(user: AdminSourcingRequestDetailApi['user']): string {
  const p = user.profile;
  const n = [p?.firstName, p?.lastName]
    .filter((x): x is string => typeof x === 'string' && Boolean(x.trim()))
    .join(' ')
    .trim();
  if (n) return n;
  return user.email?.trim() || user.phone?.trim() || '—';
}

function formatMoneyInt(n: number, numberLocale: string): string {
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatQtyUnit(qty: number, unit: string): string {
  return `${qty} ${unit}`;
}

export function SourcingAdminDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const c = adminCommonI18n(locale);
  const s = useMemo(() => adminSourcingStrings(locale), [locale]);
  const d = useMemo(() => adminOrderDetailStrings(locale), [locale]);
  const kp = useMemo(() => adminSourcingKpStrings(locale), [locale]);
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'ru-RU';

  const [detail, setDetail] = useState<AdminSourcingRequestDetailApi | null>(null);
  const [kpSummary, setKpSummary] = useState<SourcingCommercialProposalSummaryApi | null>(null);
  const [publishedKpFull, setPublishedKpFull] = useState<SourcingCommercialProposalApi[]>([]);
  const [loadingPublishedKpFull, setLoadingPublishedKpFull] = useState(false);
  const [kpSummaryLoading, setKpSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<SourcingRequestStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const row = await fetchAdminSourcingRequest(id);
      setDetail(row);
      if (row.status !== 'PENDING_REVIEW' && row.status !== 'CANCELLED') {
        setKpSummaryLoading(true);
        try {
          setKpSummary(await fetchSourcingKpSummary(id));
        } catch {
          setKpSummary(null);
        } finally {
          setKpSummaryLoading(false);
        }
      } else {
        setKpSummary(null);
        setKpSummaryLoading(false);
      }
    } catch (e) {
      setDetail(null);
      setKpSummary(null);
      setLoadError(e instanceof Error ? e.message : s.errLoadDetail);
    } finally {
      setLoading(false);
    }
  }, [id, s.errLoadDetail]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDraftStatus(null);
  }, [detail?.id, detail?.status]);

  useEffect(() => {
    if (typeof window === 'undefined' || !detail) return;
    if (window.location.hash !== '#order-chat') return;
    requestAnimationFrame(() => {
      document.getElementById('order-chat')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [detail]);

  useEffect(() => {
    const st = detail?.status;
    const showBlock = st === 'IN_PROGRESS' || st === 'COMPLETED' || st === 'CANCELLED';
    if (!showBlock || !kpSummary?.published.length) {
      setPublishedKpFull([]);
      setLoadingPublishedKpFull(false);
      return;
    }
    let cancelled = false;
    setLoadingPublishedKpFull(true);
    setPublishedKpFull([]);
    void (async () => {
      try {
        const rows = await Promise.all(
          kpSummary.published.map((p) => fetchSourcingKpPublished(id, p.versionNumber)),
        );
        if (!cancelled) setPublishedKpFull(rows);
      } catch {
        if (!cancelled) setPublishedKpFull([]);
      } finally {
        if (!cancelled) setLoadingPublishedKpFull(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, detail?.status, kpSummary?.published]);

  async function updateStatus(status: SourcingRequestStatus) {
    setSaving(true);
    setMutationError(null);
    try {
      const updated = await patchAdminSourcingRequestStatus(id, status);
      setDetail((prev) => (prev ? { ...prev, status: updated.status, updatedAt: updated.updatedAt } : prev));
      setDraftStatus(null);
      notifyAdminSourcingPendingRefresh();
      if (updated.status === 'IN_PROGRESS') {
        try {
          setKpSummary(await fetchSourcingKpSummary(id));
        } catch {
          setKpSummary(null);
        }
      }
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : c.errSave);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setCancelLoading(true);
    setMutationError(null);
    try {
      await deleteAdminSourcingRequest(id);
      setCancelOpen(false);
      notifyAdminSourcingPendingRefresh();
      router.push('/admin/orders?section=sourcing&bucket=new');
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : 'Не удалось удалить заявку');
    } finally {
      setCancelLoading(false);
    }
  }

  if (loading) return <p className={styles.muted}>Загрузка…</p>;
  if (loadError) return <p className={styles.error}>{loadError}</p>;
  if (!detail) return null;

  const isPendingReview = detail.status === 'PENDING_REVIEW';
  const isActive = detail.status === 'IN_PROGRESS';
  const isTerminal = detail.status === 'COMPLETED' || detail.status === 'CANCELLED';
  const selectedActiveStatus = draftStatus ?? detail.status;
  const statusDirty = isActive && selectedActiveStatus !== detail.status;
  const kpEnabled = isActive;
  const showPublishedKpBlock = isActive || isTerminal;

  return (
    <>
      {mutationError ? <p className={styles.error}>{mutationError}</p> : null}

      <div className={`${pn.productFormGrid} ${od.orderDetailGrid}`}>
        <div className={pn.productFormMain}>
          {isPendingReview ? (
            <div className={od.statusRow}>
              <AdminSelect
                label={d.labelStatus}
                className={od.statusSelect}
                value={detail.status}
                disabled
              >
                <option value={detail.status}>{sourcingStatusLabel(detail.status)}</option>
              </AdminSelect>
              <AdminCompactBtn
                type="button"
                variant="accent"
                disabled={saving}
                onClick={() => void updateStatus('IN_PROGRESS')}
              >
                {saving ? c.saving : 'Взять в работу'}
              </AdminCompactBtn>
            </div>
          ) : null}

          {isActive ? (
            <div className={od.statusRow}>
              <AdminSelect
                label={d.labelStatus}
                className={od.statusSelect}
                value={selectedActiveStatus}
                onChange={(e) => setDraftStatus(e.target.value as SourcingRequestStatus)}
              >
                {ACTIVE_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {sourcingStatusLabel(st)}
                  </option>
                ))}
              </AdminSelect>
              <AdminCompactBtn
                type="button"
                variant="accent"
                disabled={!statusDirty || saving}
                onClick={() => void updateStatus(selectedActiveStatus)}
              >
                {saving ? c.saving : c.save}
              </AdminCompactBtn>
            </div>
          ) : null}

          {isTerminal ? (
            <div className={od.statusRow}>
              <AdminSelect label={d.labelStatus} className={od.statusSelect} value={detail.status} disabled>
                <option value={detail.status}>{sourcingStatusLabel(detail.status)}</option>
              </AdminSelect>
            </div>
          ) : null}

          <dl className={clientsStyles.detailList}>
            <div>
              <dt>{d.labelCreated}</dt>
              <dd>{formatAdminOrderDateTime(detail.createdAt, locale)}</dd>
            </div>
            <div>
              <dt>{d.labelUpdated}</dt>
              <dd>{formatAdminOrderDateTime(detail.updatedAt, locale)}</dd>
            </div>
            <div>
              <dt>Название заявки</dt>
              <dd>{detail.title}</dd>
            </div>
            <div>
              <dt>{d.labelAccount}</dt>
              <dd>
                <Link href={`/admin/clients/${encodeURIComponent(detail.user.id)}`} className={styles.backLink}>
                  {accountDisplayName(detail.user)}
                </Link>
              </dd>
            </div>
            <div>
              <dt>{d.labelEmail}</dt>
              <dd>{detail.user.email || '—'}</dd>
            </div>
            <div>
              <dt>{d.labelPhone}</dt>
              <dd>{detail.user.phone || '—'}</dd>
            </div>
            {detail.deliveryCity?.trim() ? (
              <div>
                <dt>Город доставки</dt>
                <dd>{detail.deliveryCity}</dd>
              </div>
            ) : null}
          </dl>

          <div className={styles.section}>
            <h2 className={styles.groupHeading}>
              Товары ({detail.items.length})
            </h2>
            <AdminSourcingProductAccordion items={detail.items} requestTitle={detail.title} />
          </div>

          {detail.attachments.length > 0 ? (
            <div className={styles.section}>
              <h2 className={styles.groupHeading}>Вложения</h2>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {detail.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className={styles.backLink}>
                      {a.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showPublishedKpBlock ? (
            <div className={styles.section}>
              <h2 className={styles.groupHeading}>{kp.sectionPublished}</h2>
              {kpSummaryLoading ? (
                <p className={styles.muted}>{kp.kpPublishedLoading}</p>
              ) : kpSummary && kpSummary.published.length === 0 ? (
                <p className={styles.muted}>{kp.kpPublishedNone}</p>
              ) : loadingPublishedKpFull ? (
                <p className={styles.muted}>{kp.kpPublishedLoading}</p>
              ) : kpSummary && kpSummary.published.length > 0 && publishedKpFull.length === 0 ? (
                <p className={styles.error}>{kp.kpPublishedDetailError}</p>
              ) : (
                <div className={od.kpPublishedStack}>
                  {publishedKpFull.map((proposal) => {
                    const kpTotalRub = sourcingKpOrderTotalRub(proposal.lines);
                    const dateStr = proposal.publishedAt
                      ? formatAdminOrderDateTime(proposal.publishedAt, locale)
                      : '—';
                    return (
                      <div key={proposal.id}>
                        <p className={`${styles.cardNote} ${od.kpVersionCaption}`}>
                          {kp.kpPublishedVersionCaption(
                            proposal.versionNumber,
                            dateStr,
                            kp.itemsCount(proposal.lines.length),
                          )}
                        </p>
                        {proposal.lines.length === 0 ? (
                          <p className={styles.muted}>{kp.noItems}</p>
                        ) : (
                          <div className={styles.tableWrap}>
                            <table className={styles.table}>
                              <thead>
                                <tr>
                                  <th>{kp.thProduct}</th>
                                  <th>{kp.thQtyUnit}</th>
                                  <th>{kp.thPrice}</th>
                                  <th>{kp.thDelivery}</th>
                                  <th>{kp.thLineTotal}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {proposal.lines.map((ln) => (
                                  <tr key={ln.id}>
                                    <td>
                                      <div className={styles.cardTitle}>{ln.productName}</div>
                                      {ln.description?.trim() ? (
                                        <p className={styles.cardNote} style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>
                                          {ln.description}
                                        </p>
                                      ) : null}
                                      {(ln.imageUrls ?? []).length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                          {(ln.imageUrls ?? []).map((url, idx) => (
                                            <img
                                              key={`${url}-${idx}`}
                                              src={url}
                                              alt=""
                                              loading="lazy"
                                              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }}
                                            />
                                          ))}
                                        </div>
                                      ) : null}
                                    </td>
                                    <td>{formatQtyUnit(ln.quantity, ln.unit)}</td>
                                    <td>{formatMoneyInt(ln.offerUnitPrice, numberLocale)}</td>
                                    <td>{ln.deliveryEta?.trim() || '—'}</td>
                                    <td>{formatMoneyInt(sourcingKpLineTotalRub(ln), numberLocale)}</td>
                                  </tr>
                                ))}
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>
                                    {kp.footerSumLabel}
                                  </td>
                                  <td style={{ fontWeight: 600 }}>
                                    {formatMoneyInt(kpTotalRub, numberLocale)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          <div className={styles.section}>
            {kpSummary?.draft ? (
              <p className={`${styles.cardNote} ${od.draftHint}`}>
                {kp.draftLineCount(kpSummary.draft.lineCount)}
              </p>
            ) : null}
            <div className={styles.formActions}>
              {kpEnabled ? (
                <AdminCompactBtnLink
                  href={`/admin/orders/sourcing/${encodeURIComponent(detail.id)}/kp`}
                  variant="accent"
                >
                  {d.actionPrepareCp}
                </AdminCompactBtnLink>
              ) : isPendingReview ? (
                <AdminCompactBtn type="button" variant="accent" disabled title="Сначала возьмите заявку в работу">
                  {d.actionPrepareCp}
                </AdminCompactBtn>
              ) : null}
              {isPendingReview ? (
                <AdminCompactBtn type="button" variant="danger" onClick={() => setCancelOpen(true)}>
                  {d.actionCancelOrder}
                </AdminCompactBtn>
              ) : null}
            </div>
          </div>
        </div>

        <aside
          id="order-chat"
          className={`${pn.productFormPlacement} ${od.orderDetailPlacement}`}
          aria-label="Чат по заявке"
        >
          <AdminSourcingSideChat sourcingRequestId={detail.id} />
        </aside>
      </div>

      <AdminOrdersConfirmModal
        open={cancelOpen}
        title="Удалить заявку на подбор?"
        confirmLabel={d.cancelModalConfirm}
        cancelLabel={d.cancelModalCancel}
        loading={cancelLoading}
        onClose={() => !cancelLoading && setCancelOpen(false)}
        onConfirm={confirmDelete}
      >
        <p className={styles.muted} style={{ margin: 0 }}>
          Заявка будет удалена без возможности восстановления.
        </p>
      </AdminOrdersConfirmModal>
    </>
  );
}
