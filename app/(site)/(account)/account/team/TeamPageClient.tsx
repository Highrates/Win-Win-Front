'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import { InviteDesignerModal } from '@/components/InviteDesignerModal/InviteDesignerModal';
import { ActiveDesignerInvites } from '@/components/ActiveDesignerInvites/ActiveDesignerInvites';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { useActiveDesignerInvites } from '@/hooks/useActiveDesignerInvites';
import {
  filterTeamBranchCards,
  mapWinWinL1ToBranchCards,
  russianPluralChelovek,
  type WinWinTeamOverviewDto,
} from '@/lib/winWinTeam';
import { fetchPartnerProgramSummary, type PartnerProgramSummaryApi } from '@/lib/referrals/partnerProgramSummary';
import report from '@/components/styles/PartnerReportTable.module.css';
import { TeamSheetSection } from './TeamSheetSection';
import { TeamPageSkeleton } from './TeamPageSkeleton';
import styles from './page.module.css';

/** Контент страницы команды с модальным окном приглашения (оставляем пользователя на /account/team). */
export function TeamPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [data, setData] = useState<WinWinTeamOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myWinWinReferral, setMyWinWinReferral] = useState<string | null>(null);
  const [partnerSummary, setPartnerSummary] = useState<PartnerProgramSummaryApi | null>(null);
  const [partnerIncomeLoading, setPartnerIncomeLoading] = useState(false);
  const [partnerIncomeError, setPartnerIncomeError] = useState<string | null>(null);
  const [inviteDesignerModalOpen, setInviteDesignerModalOpen] = useState(false);
  const teamLoaded = !loading && !error && Boolean(data);
  const {
    items: activeInvites,
    total: activeInvitesTotal,
    truncated: activeInvitesTruncated,
    listLimit: activeInvitesListLimit,
    statusCounts: activeInvitesStatusCounts,
    loading: activeInvitesLoading,
    error: activeInvitesError,
    reload: reloadActiveInvites,
  } = useActiveDesignerInvites(teamLoaded);

  const loadPartnerIncome = useCallback(async () => {
    setPartnerIncomeLoading(true);
    setPartnerIncomeError(null);
    try {
      setPartnerSummary(await fetchPartnerProgramSummary());
    } catch (e) {
      setPartnerSummary(null);
      setPartnerIncomeError(e instanceof Error ? e.message : 'Не удалось загрузить доход');
    } finally {
      setPartnerIncomeLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/winwin-team', { credentials: 'same-origin', cache: 'no-store' });
      if (res.status === 403) {
        setError('forbidden');
        setData(null);
        setMyWinWinReferral(null);
        setPartnerSummary(null);
        setPartnerIncomeError(null);
        setPartnerIncomeLoading(false);
        return;
      }
      if (!res.ok) {
        setError(await readApiErrorMessage(res));
        setData(null);
        setMyWinWinReferral(null);
        setPartnerSummary(null);
        setPartnerIncomeError(null);
        setPartnerIncomeLoading(false);
        return;
      }
      const overview = (await res.json()) as WinWinTeamOverviewDto;
      setData(overview);
      setMyWinWinReferral(overview.myReferralCode?.trim() || null);
      void loadPartnerIncome();
    } catch {
      setError('Не удалось загрузить данные команды. Попробуйте позже.');
      setData(null);
      setMyWinWinReferral(null);
      setPartnerSummary(null);
      setPartnerIncomeError(null);
      setPartnerIncomeLoading(false);
    } finally {
      setLoading(false);
    }
  }, [loadPartnerIncome]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('inviteDesigner') !== '1') return;
    setInviteDesignerModalOpen(true);
    router.replace(pathname || '/account/team', { scroll: false });
  }, [pathname, router, searchParams]);

  const branchCards = useMemo(() => (data?.l1 ? mapWinWinL1ToBranchCards(data.l1) : []), [data]);
  const searchActive = search.trim().length > 0;
  const filteredBranchCards = useMemo(
    () => filterTeamBranchCards(branchCards, search),
    [branchCards, search],
  );

  const inviterHref =
    data?.inviter?.designerSlug && data.inviter.designerSlug.length > 0
      ? `/designers/${encodeURIComponent(data.inviter.designerSlug)}`
      : null;

  if (loading) {
    return <TeamPageSkeleton />;
  }

  if (error === 'forbidden') {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Команда</h1>
        <p className={styles.partnerGateText}>
          Раздел «Команда» доступен одобренным дизайнерам-партнёрам Wupapa в программе Win‑Win.
        </p>
        <Button type="button" variant="primary" onClick={() => router.push('/account/profile?tab=info')}>
          В профиль
        </Button>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Команда</h1>
        <p className={styles.partnerGateText} role="alert">
          {error ?? 'Не удалось загрузить данные'}
        </p>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Команда</h1>

      <div className={styles.topBar}>
        <SearchBox
          placeholder="Поиск по членам команды"
          ariaLabel="Поиск по членам команды"
          className={styles.teamSearchBox}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="button" variant="primary" onClick={() => setInviteDesignerModalOpen(true)}>
          Пригласить дизайнера-партнёра
        </Button>
      </div>

      <div className={styles.summaryColumn}>
        <div className={styles.summaryRowTop}>
          <p className={report.partnerStatus}>Дизайнер-партнёр Wupapa</p>
          <Link href="/referral" className={styles.programLink}>
            Подробнее о программе Win‑Win
          </Link>
        </div>

        <div className={styles.structureRow}>
          <span className={styles.structureMeta}>
            <span className={styles.structureLabel}>Структура:</span>
            <span className={styles.structurePeople}>
              {data.counts.total} {russianPluralChelovek(data.counts.total)}
            </span>
          </span>
          <span className={styles.structureDivider} aria-hidden />
          {data.inviter ? (
            inviterHref ? (
              <Link href={inviterHref} className={styles.leaderLink}>
                {data.inviter.name}
              </Link>
            ) : (
              <span className={styles.leaderPlain}>{data.inviter.name}</span>
            )
          ) : (
            <span className={styles.leaderPlain}>—</span>
          )}
          <span className={styles.structureDivider} aria-hidden />
          <span className={styles.structureLevel}>
            1 уровень — <span className={styles.levelNumber}>{data.counts.level1}</span>
          </span>
          <span className={styles.structureDivider} aria-hidden />
          <span className={styles.structureLevel}>
            2 уровень — <span className={styles.levelNumber}>{data.counts.level2}</span>
          </span>
        </div>
      </div>

      <ActiveDesignerInvites
        items={activeInvites}
        total={activeInvitesTotal}
        truncated={activeInvitesTruncated}
        listLimit={activeInvitesListLimit}
        statusCounts={activeInvitesStatusCounts}
        loading={activeInvitesLoading}
        error={activeInvitesError}
        onRetry={() => void reloadActiveInvites()}
        onChanged={() => void reloadActiveInvites()}
        collapsible
        visibleLimit={5}
      />

      <TeamSheetSection
        branchCards={filteredBranchCards}
        searchActive={searchActive}
        partnerSummary={partnerSummary}
        partnerIncomeLoading={partnerIncomeLoading}
        partnerIncomeError={partnerIncomeError}
        onRetryPartnerIncome={() => void loadPartnerIncome()}
      />

      <InviteDesignerModal
        open={inviteDesignerModalOpen}
        onClose={() => setInviteDesignerModalOpen(false)}
        referralCode={myWinWinReferral}
        referralCodeLoading={loading}
        onSent={reloadActiveInvites}
      />
    </div>
  );
}
