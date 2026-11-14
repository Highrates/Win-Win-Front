'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { formatTourDateRange } from '@/lib/chinaTours/formatTourDate';
import type {
  ChinaTourDetail,
  ChinaTourMyApplication,
  ChinaTourMyReview,
} from '@/lib/chinaTours/types';
import shared from '../tours.module.css';
import { TourApplyModal } from './TourApplyModal';
import { TourDetailDayNav } from './TourDetailDayNav';
import { TourDetailProgram } from './TourDetailProgram';
import { TourReviewsSection } from './TourReviewsSection';
import styles from './tourDetail.module.css';

function SeatsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 20c1.5-3.2 4.3-5 8-5s6.5 1.8 8 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Props = {
  tour: ChinaTourDetail;
  isAuthenticated: boolean;
};

const DAY_OUT_MS = 580;
const DAY_IN_MS = 700;
const LINE_IN_DELAY_MS = 140;
const THUMBS_IN_DELAY_MS = 80;

export function TourDetailClient({ tour, isAuthenticated }: Props) {
  const router = useRouter();
  const [dayIndex, setDayIndex] = useState(0);
  const day = tour.days[dayIndex] ?? tour.days[0] ?? null;
  const [slideIndex, setSlideIndex] = useState(0);
  const [dayPhase, setDayPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [lineIndex, setLineIndex] = useState(0);
  const [thumbsVisible, setThumbsVisible] = useState(true);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const dayAnimTimers = useRef<number[]>([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyView, setApplyView] = useState<'form' | 'success'>('form');
  const [comment, setComment] = useState('');
  const [applyBusy, setApplyBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myApp, setMyApp] = useState<ChinaTourMyApplication>(null);
  const [myReview, setMyReview] = useState<ChinaTourMyReview>(null);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  const closeApply = useCallback(() => {
    if (applyBusy) return;
    setApplyOpen(false);
    setApplyView('form');
    setError(null);
  }, [applyBusy]);

  const galleryUrls: string[] = (() => {
    if (!day) return [];
    const urls: string[] = [];
    if (day.heroUrl) urls.push(day.heroUrl);
    for (const u of day.galleryUrls) {
      if (u && !urls.includes(u)) urls.push(u);
    }
    return urls;
  })();

  const thumbUrls = galleryUrls.filter((_, i) => i !== slideIndex).slice(0, 3);

  function clearDayAnimTimers() {
    dayAnimTimers.current.forEach((id) => window.clearTimeout(id));
    dayAnimTimers.current = [];
  }

  useEffect(() => () => clearDayAnimTimers(), []);

  useEffect(() => {
    setSlideIndex(0);
    timelineScrollRef.current?.scrollTo({ top: 0 });
  }, [day?.id]);

  function selectThumb(url: string) {
    if (dayPhase !== 'idle') return;
    const next = galleryUrls.indexOf(url);
    if (next < 0 || next === slideIndex) return;
    setSlideIndex(next);
  }

  function selectDay(i: number) {
    if (i === dayIndex || dayPhase !== 'idle') return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setDayIndex(i);
      setLineIndex(i);
      setSlideIndex(0);
      setThumbsVisible(true);
      timelineScrollRef.current?.scrollTo({ top: 0 });
      return;
    }

    clearDayAnimTimers();
    setDayPhase('out');
    setThumbsVisible(false);
    setLineIndex(-1);

    const outTimer = window.setTimeout(() => {
      setDayIndex(i);
      setSlideIndex(0);
      timelineScrollRef.current?.scrollTo({ top: 0 });
      setDayPhase('in');

      const lineTimer = window.setTimeout(() => {
        setLineIndex(i);
      }, LINE_IN_DELAY_MS);

      const thumbsTimer = window.setTimeout(() => {
        setThumbsVisible(true);
      }, DAY_IN_MS + THUMBS_IN_DELAY_MS);

      const idleTimer = window.setTimeout(() => {
        setDayPhase('idle');
      }, DAY_IN_MS);

      dayAnimTimers.current.push(lineTimer, thumbsTimer, idleTimer);
    }, DAY_OUT_MS);

    dayAnimTimers.current.push(outTimer);
  }

  const daySwapClass = [
    styles.daySwap,
    dayPhase === 'out' ? styles.daySwapOut : '',
    dayPhase === 'in' ? styles.daySwapIn : '',
  ]
    .filter(Boolean)
    .join(' ');

  const mediaStageClass = [
    styles.dayMediaStage,
    dayPhase === 'out' ? styles.dayMediaStageOut : '',
    dayPhase === 'in' ? styles.dayMediaStageIn : '',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const [appRes, revRes] = await Promise.all([
          fetch(`/api/user/china-tours/${encodeURIComponent(tour.slug)}/applications`, {
            credentials: 'same-origin',
          }),
          fetch(`/api/user/china-tours/${encodeURIComponent(tour.slug)}/reviews`, {
            credentials: 'same-origin',
          }),
        ]);
        if (appRes.ok) {
          const j = (await appRes.json()) as ChinaTourMyApplication;
          setMyApp(j);
        }
        if (revRes.ok) {
          const j = (await revRes.json()) as ChinaTourMyReview;
          setMyReview(j);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [isAuthenticated, tour.slug]);

  const canReapply = !myApp || myApp.status === 'REJECTED';
  const joinLocked = Boolean(myApp && myApp.status !== 'REJECTED');

  function handleJoinClick() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/tours/${tour.slug}`)}`);
      return;
    }
    if (!canReapply) return;
    setApplyView('form');
    setError(null);
    setApplyOpen(true);
  }

  async function submitApplication() {
    setApplyBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/china-tours/${encodeURIComponent(tour.slug)}/applications`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment.trim() || undefined }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = 'Не удалось отправить заявку';
        try {
          const j = JSON.parse(text) as { message?: string };
          if (j.message) msg = j.message;
        } catch {
          /* */
        }
        throw new Error(msg);
      }
      const created = JSON.parse(text) as NonNullable<ChinaTourMyApplication>;
      setMyApp(created);
      setComment('');
      setApplyView('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setApplyBusy(false);
    }
  }

  async function submitReview() {
    setReviewBusy(true);
    setReviewMsg(null);
    try {
      const res = await fetch(`/api/user/china-tours/${encodeURIComponent(tour.slug)}/reviews`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reviewBody.trim(), rating: reviewRating }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = 'Не удалось отправить отзыв';
        try {
          const j = JSON.parse(text) as { message?: string };
          if (j.message) msg = j.message;
        } catch {
          /* */
        }
        throw new Error(msg);
      }
      const created = JSON.parse(text) as NonNullable<ChinaTourMyReview>;
      setMyReview(created);
      setReviewBody('');
      setReviewMsg('Отзыв отправлен на модерацию');
    } catch (e) {
      setReviewMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setReviewBusy(false);
    }
  }

  const joinLabel = myApp
    ? myApp.status === 'PENDING'
      ? 'Заявка отправлена'
      : myApp.status === 'ACCEPTED'
        ? 'Вы в группе'
        : 'Подать снова'
    : 'Присоединиться';

  const canLeaveReview =
    tour.canReview && isAuthenticated && myApp?.status === 'ACCEPTED';

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Туры в Китай', href: '/tours', current: false },
    { label: tour.title, href: '', current: true },
  ];

  return (
    <section className={shared.pageSection}>
      <div className={styles.detailLayout}>
        <nav
          className={`${shared.breadcrumbs} ${styles.detailCrumbs}`}
          aria-label="Хлебные крошки"
        >
          {breadcrumbs.map((item, i) => (
            <Fragment key={`${item.href}-${i}`}>
              {i > 0 ? <span className={shared.breadcrumbsSep}>/</span> : null}
              {item.current ? (
                <span className={shared.breadcrumbsCurrent}>{item.label}</span>
              ) : (
                <Link href={item.href} className={shared.breadcrumbsLink}>
                  {item.label}
                </Link>
              )}
            </Fragment>
          ))}
        </nav>

        <header className={styles.detailHead}>
          <p className={`h5 ${styles.detailDate}`}>
            {formatTourDateRange(tour.startsAt, tour.endsAt)}
          </p>
          <h1 className={`h1 ${styles.detailTitle}`}>{tour.title}</h1>
        </header>

        <div className={styles.detailAside}>
          <div className={styles.joinBlock}>
            <div className={styles.joinRow}>
              <Button
                type="button"
                variant="primary"
                className={styles.joinBtn}
                disabled={joinLocked}
                onClick={handleJoinClick}
              >
                {joinLabel}
              </Button>
              <span className={`text-card-16-400 ${shared.seats}`}>
                <SeatsIcon />
                {tour.seatsTaken}/{tour.seatsTotal}
              </span>
            </div>
            {joinLocked ? (
              <Link href="/account/tours" className={styles.myApplicationsLink}>
                Мои заявки
              </Link>
            ) : null}
          </div>

          <TourDetailDayNav
            days={tour.days}
            dayIndex={dayIndex}
            lineIndex={lineIndex}
            dayPhase={dayPhase}
            onSelectDay={selectDay}
          />
        </div>

        <TourDetailProgram
          tourTitle={tour.title}
          day={day}
          daySwapClass={daySwapClass}
          mediaStageClass={mediaStageClass}
          galleryUrls={galleryUrls}
          thumbUrls={thumbUrls}
          slideIndex={slideIndex}
          thumbsVisible={thumbsVisible}
          timelineScrollRef={timelineScrollRef}
          onSelectThumb={selectThumb}
        />
      </div>

      <TourReviewsSection
        reviews={tour.reviews}
        canLeaveReview={canLeaveReview}
        myReview={myReview}
        reviewBody={reviewBody}
        reviewRating={reviewRating}
        reviewMsg={reviewMsg}
        busy={reviewBusy}
        onBodyChange={setReviewBody}
        onRatingChange={setReviewRating}
        onSubmit={() => void submitReview()}
      />

      <TourApplyModal
        open={applyOpen}
        view={applyView}
        tourTitle={tour.title}
        startsAt={tour.startsAt}
        endsAt={tour.endsAt}
        seatsTaken={tour.seatsTaken}
        seatsTotal={tour.seatsTotal}
        comment={comment}
        busy={applyBusy}
        error={error}
        onCommentChange={setComment}
        onClose={closeApply}
        onSubmit={() => void submitApplication()}
      />
    </section>
  );
}
