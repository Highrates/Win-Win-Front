'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import { TextField } from '@/components/TextField';
import btnStyles from '@/components/Button/Button.module.css';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';
import { copyTextToClipboard } from '@/lib/copyToClipboard';
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import { mapWinWinL1ToBranchCards, type WinWinTeamOverviewDto } from '@/lib/winWinTeam';
import profileSheetStyles from '../profile/page.module.css';
import { TeamSheetSection } from './TeamSheetSection';
import styles from './page.module.css';

function normalizeSearch(q: string): string {
  return q.trim().toLowerCase();
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

  const [inviteDesignerModalOpen, setInviteDesignerModalOpen] = useState(false);
  const [inviteDesignerEmail, setInviteDesignerEmail] = useState('');
  const [inviteDesignerSending, setInviteDesignerSending] = useState(false);
  const [inviteDesignerError, setInviteDesignerError] = useState<string | null>(null);
  const [inviteDesignerDone, setInviteDesignerDone] = useState(false);
  const [inviteDesignerInviteLink, setInviteDesignerInviteLink] = useState<string | null>(null);
  const [inviteDesignerCopied, setInviteDesignerCopied] = useState(false);

  const closeInviteDesignerModal = useCallback(() => {
    setInviteDesignerModalOpen(false);
    setInviteDesignerEmail('');
    setInviteDesignerError(null);
    setInviteDesignerDone(false);
    setInviteDesignerInviteLink(null);
    setInviteDesignerCopied(false);
  }, []);

  useModalBodyLock(inviteDesignerModalOpen, closeInviteDesignerModal);

  const copyDesignerInviteLink = useCallback(async () => {
    if (!inviteDesignerInviteLink) return;
    try {
      await copyTextToClipboard(inviteDesignerInviteLink);
      setInviteDesignerCopied(true);
      window.setTimeout(() => setInviteDesignerCopied(false), 3000);
    } catch {
      setInviteDesignerCopied(false);
    }
  }, [inviteDesignerInviteLink]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/winwin-team', { credentials: 'same-origin', cache: 'no-store' });
      if (res.status === 403) {
        setError('forbidden');
        setData(null);
        return;
      }
      if (!res.ok) {
        setError(await readApiErrorMessage(res));
        setData(null);
        return;
      }
      setData((await res.json()) as WinWinTeamOverviewDto);
    } catch {
      setError('Не удалось загрузить данные команды. Попробуйте позже.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('inviteDesigner') !== '1') return;
    setInviteDesignerError(null);
    setInviteDesignerDone(false);
    setInviteDesignerEmail('');
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

  const submitInviteDesigner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteDesignerError(null);
    const em = inviteDesignerEmail.trim().toLowerCase();
    if (!em.includes('@')) {
      setInviteDesignerError('Введите корректный email');
      return;
    }
    setInviteDesignerSending(true);
    try {
      const res = await fetch('/api/user/designer-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
        credentials: 'same-origin',
      });
      if (!res.ok) {
        setInviteDesignerError(await readApiErrorMessage(res));
        return;
      }
      const j = (await res.json()) as { inviteLink?: string };
      setInviteDesignerInviteLink(
        typeof j.inviteLink === 'string' && j.inviteLink.length > 0 ? j.inviteLink : null,
      );
      setInviteDesignerDone(true);
    } catch {
      setInviteDesignerError('Не удалось отправить. Повторите позже.');
    } finally {
      setInviteDesignerSending(false);
    }
  };

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

  const openInviteDesignerModal = useCallback(() => {
    setInviteDesignerError(null);
    setInviteDesignerDone(false);
    setInviteDesignerEmail('');
    setInviteDesignerInviteLink(null);
    setInviteDesignerCopied(false);
    setInviteDesignerModalOpen(true);
  }, []);

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
        <Button type="button" variant="primary" onClick={openInviteDesignerModal}>
          Пригласить дизайнера
        </Button>
      </div>

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

      <TeamSheetSection branchCards={filteredBranchCards} />

      {inviteDesignerModalOpen ? (
        <>
          <button
            type="button"
            className={profileSheetStyles.aboutModalBackdrop}
            aria-label="Закрыть"
            onClick={closeInviteDesignerModal}
          />
          <section
            className={profileSheetStyles.aboutModalPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Пригласить дизайнера"
          >
            <header className={profileSheetStyles.aboutModalHeader}>
              <button
                type="button"
                className={profileSheetStyles.aboutModalIconBtn}
                onClick={closeInviteDesignerModal}
                aria-label="Закрыть"
              >
                <CloseIcon />
              </button>
            </header>
            <div className={profileSheetStyles.aboutModalInner}>
              {inviteDesignerDone ? (
                <>
                  <h3 className={profileSheetStyles.aboutModalTitle}>Письмо с приглашением отправлено</h3>
                  <p className={profileSheetStyles.partnerSuccessText}>
                    Ссылку с приглашением можно скопировать и отправить напрямую! Срок действия — 14 дней, одно
                    использование.
                  </p>
                  <div className={profileSheetStyles.aboutModalActions}>
                    {inviteDesignerInviteLink ? (
                      <button
                        type="button"
                        className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${profileSheetStyles.inviteLinkCopyBtn} ${inviteDesignerCopied ? profileSheetStyles.inviteLinkCopyBtnDone : ''}`}
                        onClick={() => {
                          void copyDesignerInviteLink();
                        }}
                      >
                        {inviteDesignerCopied ? 'Скопировано!' : 'Скопировать ссылку с приглашением'}
                      </button>
                    ) : null}
                    <Button type="button" variant="primary" onClick={closeInviteDesignerModal}>
                      Понятно
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className={profileSheetStyles.aboutModalTitle}>Пригласить дизайнера</h3>
                  <form onSubmit={submitInviteDesigner} noValidate>
                    <div className={profileSheetStyles.partnerFormField}>
                      <TextField
                        label="Email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={inviteDesignerEmail}
                        onChange={(e) => {
                          setInviteDesignerEmail(e.target.value);
                          setInviteDesignerError(null);
                        }}
                        error={inviteDesignerError || undefined}
                      />
                    </div>
                    <div className={profileSheetStyles.partnerFormField}>
                      <TextField
                        label="Реферальный номер"
                        type="text"
                        name="referralCode"
                        autoComplete="off"
                        value={myWinWinReferral ?? ''}
                        disabled
                      />
                    </div>
                    <div className={profileSheetStyles.aboutModalActions}>
                      <Button type="submit" variant="primary" disabled={inviteDesignerSending}>
                        {inviteDesignerSending ? 'Отправка…' : 'Отправить приглашение'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
