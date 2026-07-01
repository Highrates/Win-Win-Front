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
import { mapWinWinL1ToBranchCards, type WinWinTeamOverviewDto } from '@/lib/winWinTeam';
import { fetchPartnerProgramSummary, type PartnerProgramSummaryApi } from '@/lib/referrals/partnerProgramSummary';
import { TeamSheetSection } from './TeamSheetSection';
import styles from './page.module.css';

function normalizeSearch(q: string): string {
  return q.trim().toLowerCase();
}

function russianPluralChelovek(count: number): string {
  const n = Math.abs(Math.floor(Number(count)));
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'человек';
  if (mod10 === 1) return 'человек';
  if (mod10 >= 2 && mod10 <= 4) return 'человека';
  return 'человек';
}

type ProfileRefDto = { winWinReferralCode?: string | null };

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
  const [inviteDesignerModalOpen, setInviteDesignerModalOpen] = useState(false);
  const teamLoaded = !loading && !error && Boolean(data);
  const { items: activeInvites, reload: reloadActiveInvites } = useActiveDesignerInvites(teamLoaded);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/winwin-team', { credentials: 'same-origin', cache: 'no-store' });
      if (res.status === 403) {
        setError('forbidden');
        setData(null);
        setPartnerSummary(null);
        setPartnerIncomeLoading(false);
        return;
      }
      if (!res.ok) {
        setError(await readApiErrorMessage(res));
        setData(null);
        setPartnerSummary(null);
        setPartnerIncomeLoading(false);
        return;
      }
      setData((await res.json()) as WinWinTeamOverviewDto);
      setPartnerIncomeLoading(true);
      setPartnerSummary(null);
      void fetchPartnerProgramSummary()
        .then((s) => setPartnerSummary(s))
        .catch(() => setPartnerSummary(null))
        .finally(() => setPartnerIncomeLoading(false));
    } catch {
      setError('Не удалось загрузить данные команды. Попробуйте позже.');
      setData(null);
      setPartnerSummary(null);
      setPartnerIncomeLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('inviteDesigner') !== '1') return;
    setInviteDesignerModalOpen(true);
    router.replace(pathname || '/account/team', { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!data) return;
    void (async () => {
      try {
        const res = await fetch('/api/user/profile', { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) return;
        const p = (await res.json()) as ProfileRefDto;
        setMyWinWinReferral(p.winWinReferralCode?.trim() || null);
      } catch {
        /* ignore */
      }
    })();
  }, [data]);

  const branchCards = useMemo(() => (data?.l1 ? mapWinWinL1ToBranchCards(data.l1) : []), [data]);

  const filteredBranchCards = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return branchCards;
    return branchCards.filter((c) => {
      const hay = `${c.name} ${c.city} ${c.members.map((m) => `${m.name} ${m.city}`).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [branchCards, search]);

  const inviterHref =
    data?.inviter?.designerSlug && data.inviter.designerSlug.length > 0
      ? `/designers/${encodeURIComponent(data.inviter.designerSlug)}`
      : null;

  if (loading) {
    return <p className={styles.pageLeadMuted}>Загрузка…</p>;
  }

  if (error === 'forbidden') {
    return (
      <div className={styles.page}>
        <p className={styles.partnerGateText}>
          Раздел «Команда» доступен одобренным партнёрам Win‑Win.
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
      <div className={styles.topBar}>
        <SearchBox
          placeholder="Поиск по членам команды"
          ariaLabel="Поиск по членам команды"
          className={styles.teamSearchBox}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="button" variant="primary" onClick={() => setInviteDesignerModalOpen(true)}>
          Пригласить дизайнера
        </Button>
      </div>

      <ActiveDesignerInvites items={activeInvites} />

      <div className={styles.summaryColumn}>
        <div className={styles.summaryRowTop}>
          <p className={styles.partnerStatus}>Партнер Win-win</p>
          <Link href="/referral" className={styles.programLink}>
            Подробнее о программе Win Win
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

      <TeamSheetSection
        branchCards={filteredBranchCards}
        partnerSummary={partnerSummary}
        partnerIncomeLoading={partnerIncomeLoading}
      />

      <InviteDesignerModal
        open={inviteDesignerModalOpen}
        onClose={() => setInviteDesignerModalOpen(false)}
        referralCode={myWinWinReferral}
        onSent={() => void reloadActiveInvites()}
      />
    </div>
  );
}
