'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { adminBackendFetch } from '@/lib/adminBackendFetch';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminApplicationDetailPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
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

function formatAt(
  iso: string | null | undefined,
  loc: 'ru' | 'zh',
  empty: string,
) {
  if (!iso) return empty;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return empty;
  return d.toLocaleString(loc === 'zh' ? 'zh-CN' : 'ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

export function ApplicationDetailClient({ id, t }: { id: string; t: DetailCopy }) {
  const router = useRouter();
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
      const res = await fetch(`/api/admin/backend/users/admin/${encodeURIComponent(id)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.status === 404) {
        setError(t.notFound);
        setData(null);
        return;
      }
      if (!res.ok) {
        setError(t.errLoad);
        setData(null);
        return;
      }
      setData((await res.json()) as UserPayload);
    } catch {
      setError(t.errLoad);
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
  const pendingReview =
    Boolean(p?.partnerApplicationSubmittedAt) && !approved && !rejected;
  const showActionButtons = Boolean(data && pendingReview);

  useEffect(() => {
    setInviterUserId(null);
    if (!refCode || exempt) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/backend/users/admin/by-winwin-referral-code/resolve?code=${encodeURIComponent(refCode)}`,
          { credentials: 'same-origin', cache: 'no-store' },
        );
        const j = (await res.json().catch(() => ({}))) as { userId?: string | null };
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
      const res = await adminBackendFetch(
        `users/admin/partner-applications/${encodeURIComponent(data.id)}/approve`,
        { method: 'POST', body: '{}' },
      );
      if (!res.ok) {
        setActionError(t.errAccept);
        return;
      }
      document.dispatchEvent(new Event('admin-partner-pending-refresh'));
      router.push('/admin/applications');
    } catch {
      setActionError(t.errAccept);
    } finally {
      setActionId(null);
    }
  }

  async function doReject() {
    if (!data) return;
    if (!window.confirm(t.rejectConfirm)) return;
    setActionId('reject');
    setActionError(null);
    try {
      const res = await adminBackendFetch(
        `users/admin/partner-applications/${encodeURIComponent(data.id)}/reject`,
        { method: 'POST', body: '{}' },
      );
      if (!res.ok) {
        setActionError(t.errReject);
        return;
      }
      document.dispatchEvent(new Event('admin-partner-pending-refresh'));
      router.push('/admin/applications');
    } catch {
      setActionError(t.errReject);
    } finally {
      setActionId(null);
    }
  }

  return (
    <main className={catalogStyles.panel}>
      <p>
        <Link className={catalogStyles.backLink} href="/admin/applications">
          {t.back}
        </Link>
      </p>
      <h1>{t.title}</h1>
      {showActionButtons ? (
        <div className={appStyles.detailActions}>
          <button
            type="button"
            className={catalogStyles.btn}
            disabled={actionId !== null}
            onClick={() => void doAccept()}
          >
            {actionId === 'accept' ? '…' : t.accept}
          </button>
          <button
            type="button"
            className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
            disabled={actionId !== null}
            onClick={() => void doReject()}
          >
            {actionId === 'reject' ? '…' : t.reject}
          </button>
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

          <div className={appStyles.detailBlock}>
            <h2 className={appStyles.detailBlockTitle}>{t.metaTitle}</h2>
            <dl className={appStyles.detailDl}>
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
                <dd>
                  {formatAt(p?.partnerApplicationSubmittedAt, consLocale, '—')}
                </dd>
              </div>
              {p?.partnerApplicationRejectedAt ? (
                <div>
                  <dt>{t.labelRejected}</dt>
                  <dd>
                    {formatAt(p.partnerApplicationRejectedAt, consLocale, '—')}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>{t.labelPartner}</dt>
                <dd>{approved ? t.statusApproved : t.statusPending}</dd>
              </div>
            </dl>
          </div>

          <div className={appStyles.detailBlock}>
            <h2 className={appStyles.detailBlockTitle}>{t.aboutTitle}</h2>
            <p className={appStyles.detailText}>{cover || '—'}</p>
          </div>

          <div className={appStyles.detailBlock}>
            <h2 className={appStyles.detailBlockTitle}>{t.refTitle}</h2>
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
                      <span className={catalogStyles.muted}>(приглашающий не найден)</span>
                    </>
                  )
                ) : (
                  '—'
                )}
              </p>
            )}
          </div>

          <div className={appStyles.detailBlock}>
            <h2 className={appStyles.detailBlockTitle}>{t.cvTitle}</h2>
            {cv ? (
              <a href={cv} target="_blank" rel="noreferrer" className={catalogStyles.backLink}>
                {t.openCv}
              </a>
            ) : (
              <p className={appStyles.detailText}>{t.noCv}</p>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
