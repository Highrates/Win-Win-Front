'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import { adminDetailErrorFromBackend, adminQueryErrorFromBackend } from '@/lib/adminQuery';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminApplicationDetailPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import clientsStyles from '../../clients/clients.module.css';
import appStyles from '../applications.module.css';

type DetailCopy = ReturnType<typeof adminApplicationDetailPage>;

type UserPayload = {
  id: string;
  email: string | null;
  referralInviteCodeExempt?: boolean;
  profile: null | {
    firstName: string | null;
    lastName: string | null;
    partnerApplicationCoverLetter: string | null;
    partnerApplicationCvUrl: string | null;
    partnerApplicationReferralCode: string | null;
    partnerApplicationSubmittedAt: string | null;
    partnerApplicationRejectedAt: string | null;
    winWinPartnerApproved: boolean | null;
  };
};

function formatName(p: UserPayload['profile'] | undefined): string {
  if (!p) return '—';
  const t = [p.firstName, p.lastName].filter((x) => x && String(x).trim()).join(' ').trim();
  return t || '—';
}

function formatAt(iso: string | null | undefined, loc: 'ru' | 'zh', empty: string) {
  if (!iso) return empty;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return empty;
  return d.toLocaleString(loc === 'zh' ? 'zh-CN' : 'ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

export function ApplicationDetailClient({ id, t }: { id: string; t: DetailCopy }) {
  const router = useRouter();
  const { confirm } = useAdminConfirm();
  const { locale: adminLoc } = useAdminLocale();
  const consLocale: 'ru' | 'zh' = adminLoc === 'zh' ? 'zh' : 'ru';
  const [data, setData] = useState<UserPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<'accept' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviterUserId, setInviterUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminBackendJson<UserPayload>(`users/admin/${encodeURIComponent(id)}`));
    } catch (e) {
      setError(adminDetailErrorFromBackend(e, { fallback: t.errLoad, notFound: t.notFound }));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, t.errLoad, t.notFound]);

  useEffect(() => {
    void load();
  }, [load]);

  const p = data?.profile;
  const cv = p?.partnerApplicationCvUrl?.trim();
  const refCode = p?.partnerApplicationReferralCode?.trim();
  const cover = p?.partnerApplicationCoverLetter?.trim();
  const exempt = Boolean(data?.referralInviteCodeExempt);
  const approved = Boolean(p?.winWinPartnerApproved);
  const rejected = Boolean(p?.partnerApplicationRejectedAt);
  const pendingReview = Boolean(p?.partnerApplicationSubmittedAt) && !approved && !rejected;
  const showActionButtons = Boolean(data && pendingReview);

  useEffect(() => {
    setInviterUserId(null);
    if (!refCode || exempt) return;
    let cancelled = false;
    void (async () => {
      try {
        const j = await adminBackendJson<{ userId?: string | null }>(
          `users/admin/by-winwin-referral-code/resolve?code=${encodeURIComponent(refCode)}`,
        );
        if (!cancelled) setInviterUserId(typeof j.userId === 'string' ? j.userId : null);
      } catch {
        if (!cancelled) setInviterUserId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exempt, refCode]);

  async function doAccept() {
    if (!data) return;
    setActionId('accept');
    setActionError(null);
    try {
      await adminBackendJson(
        `users/admin/partner-applications/${encodeURIComponent(data.id)}/approve`,
        { method: 'POST', body: '{}' },
      );
      document.dispatchEvent(new Event('admin-partner-pending-refresh'));
      router.push('/admin/applications');
    } catch (e) {
      setActionError(adminQueryErrorFromBackend(e, t.errAccept));
    } finally {
      setActionId(null);
    }
  }

  async function doReject() {
    if (!data) return;
    if (!(await confirm({ title: t.rejectConfirm, confirmLabel: t.reject }))) return;
    setActionId('reject');
    setActionError(null);
    try {
      await adminBackendJson(
        `users/admin/partner-applications/${encodeURIComponent(data.id)}/reject`,
        { method: 'POST', body: '{}' },
      );
      document.dispatchEvent(new Event('admin-partner-pending-refresh'));
      router.push('/admin/applications');
    } catch (e) {
      setActionError(adminQueryErrorFromBackend(e, t.errReject));
    } finally {
      setActionId(null);
    }
  }

  return (
      <main>
      <p className={catalogStyles.backRow}>
        <Link className={catalogStyles.backLink} href="/admin/applications">
          {t.back}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>{t.title}</h1>

      {showActionButtons ? (
        <div className={catalogStyles.formActions}>
          <AdminCompactBtn
            type="button"
            variant="accent"
            disabled={actionId !== null}
            onClick={() => void doAccept()}
          >
            {actionId === 'accept' ? '…' : t.accept}
          </AdminCompactBtn>
          <AdminCompactBtn
            type="button"
            variant="danger"
            disabled={actionId !== null}
            onClick={() => void doReject()}
          >
            {actionId === 'reject' ? '…' : t.reject}
          </AdminCompactBtn>
        </div>
      ) : null}

      {actionError ? (
        <p className={catalogStyles.error} role="alert">
          {actionError}
        </p>
      ) : null}
      {loading ? <p className={catalogStyles.muted}>…</p> : null}
      {error ? (
        <p className={catalogStyles.error} role="alert">
          {error}
        </p>
      ) : null}

      {data && !error ? (
        <div className={appStyles.detailRoot}>
          <p>
            <Link
              className={catalogStyles.backLink}
              href={`/admin/clients/${encodeURIComponent(data.id)}`}
            >
              {t.openClient}
            </Link>
          </p>

          <section>
            <h2 className={catalogStyles.groupHeading}>{t.metaTitle}</h2>
            <dl className={clientsStyles.detailList}>
              <div>
                <dt>{t.labelEmail}</dt>
                <dd>{data.email?.trim() || '—'}</dd>
              </div>
              <div>
                <dt>{t.labelName}</dt>
                <dd>{formatName(p)}</dd>
              </div>
              <div>
                <dt>{t.labelSubmitted}</dt>
                <dd>{formatAt(p?.partnerApplicationSubmittedAt, consLocale, '—')}</dd>
              </div>
              {p?.partnerApplicationRejectedAt ? (
                <div>
                  <dt>{t.labelRejected}</dt>
                  <dd>{formatAt(p.partnerApplicationRejectedAt, consLocale, '—')}</dd>
                </div>
              ) : null}
              <div>
                <dt>{t.labelPartner}</dt>
                <dd>{approved ? t.statusApproved : t.statusPending}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className={catalogStyles.groupHeading}>{t.aboutTitle}</h2>
            <p className={appStyles.detailText}>{cover || '—'}</p>
          </section>

          <section>
            <h2 className={catalogStyles.groupHeading}>{t.refTitle}</h2>
            {exempt ? (
              <p className={appStyles.detailText}>{t.refExempt}</p>
            ) : (
              <p className={appStyles.detailText}>
                {refCode ? (
                  inviterUserId ? (
                    <Link
                      href={`/admin/clients/${encodeURIComponent(inviterUserId)}`}
                      className={catalogStyles.backLink}
                      title="Открыть приглашающего"
                    >
                      {refCode}
                    </Link>
                  ) : (
                    <>
                      {refCode}{' '}
                      <span className={catalogStyles.mutedInline}>(приглашающий не найден)</span>
                    </>
                  )
                ) : (
                  '—'
                )}
              </p>
            )}
          </section>

          <section>
            <h2 className={catalogStyles.groupHeading}>{t.cvTitle}</h2>
            {cv ? (
              <a href={cv} target="_blank" rel="noreferrer" className={catalogStyles.backLink}>
                {t.openCv}
              </a>
            ) : (
              <p className={appStyles.detailText}>{t.noCv}</p>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
