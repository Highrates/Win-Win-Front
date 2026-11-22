'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from 'react';
import { formatTourDateChip } from '@/lib/chinaTours/formatTourDate';
import { tourImageUnoptimized } from '@/lib/chinaTours/tourImage';
import type { ChinaTourListItem, ChinaToursLanding } from '@/lib/chinaTours/types';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import { fixRussianHangingPrepositions } from '@/lib/typography/fixRussianHangingPrepositions';
import styles from './tours.module.css';

const DEFAULT_INTRO_TITLE = 'WUPAPA ОРГАНИЗОВЫВАЕТ МЕБЕЛЬНЫЕ ТУРЫ В КИТАЙ';

function TourMediaImage({
  url,
  alt,
  className,
  width,
  height,
  sizes,
}: {
  url: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  sizes: string;
}) {
  const src = resolveMediaUrlForClient(url);
  return (
    <Image
      className={className}
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      unoptimized={tourImageUnoptimized(src)}
    />
  );
}

function SeatsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 20c1.5-3.2 4.3-5 8-5s6.5 1.8 8 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Лёгкая «от руки» овальная обводка — рисуется при появлении. */
function DateChipHandOutline() {
  return (
    <svg className={styles.dateChipOutline} viewBox="0 0 200 56" fill="none" aria-hidden>
      <path
        className={styles.handOutlinePath}
        d="M20 28
           C18 15, 36 7, 62 6
           C92 4.8, 124 5.2, 152 7
           C174 8.5, 184 16, 183 28
           C182 40.5, 168 48, 142 50
           C112 52, 78 51.5, 50 49
           C30 47, 21.5 39, 20 28 Z"
        pathLength={1}
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Круглая обводка «от руки» для CTA-стрелки. */
function RoundLinkHandOutline() {
  return (
    <svg className={styles.roundLinkOutline} viewBox="0 0 52 52" fill="none" aria-hidden>
      <path
        className={styles.handOutlinePath}
        d="M26 3.2
           C34.5 2.4, 43.2 6.2, 47.2 13.5
           C50.8 20.2, 50.5 29.5, 46.8 36.2
           C42.6 43.8, 33.8 49.2, 25.2 49
           C16.2 48.8, 7.8 43.5, 4.4 35.5
           C1.2 28, 2.2 18.2, 7.2 11.5
           C12.4 4.6, 19.5 3.8, 26 3.2 Z"
        pathLength={1}
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function renderIntroTitle(raw: string | null | undefined): ReactNode {
  const title = raw?.trim() || DEFAULT_INTRO_TITLE;
  if (title.toUpperCase() === DEFAULT_INTRO_TITLE) {
    return (
      <>
        <span className={styles.introTitleLine}>WUPAPA</span>
        <span className={styles.introTitleLine}>ОРГАНИЗОВЫВАЕТ</span>
        <span className={styles.introTitleLine}>МЕБЕЛЬНЫЕ ТУРЫ</span>
        <span className={styles.introTitleLine}>В&nbsp;КИТАЙ</span>
      </>
    );
  }
  return fixRussianHangingPrepositions(title);
}

type Props = {
  landing: ChinaToursLanding | null;
  tours: ChinaTourListItem[];
  /** `home` — врезка на главной без крошек и без отступа под хедер. */
  variant?: 'page' | 'home';
};

export function ToursListingClient({ landing, tours, variant = 'page' }: Props) {
  const isHome = variant === 'home';
  const Root: ElementType = isHome ? 'div' : 'section';
  /** На главной заголовок секции уже «Туры» (h5) — intro/карточки не дублируем как heading. */
  const IntroTitleTag: ElementType = isHome ? 'p' : 'h1';
  const CardTitleTag: ElementType = isHome ? 'p' : 'h2';
  const [activeId, setActiveId] = useState(tours[0]?.id ?? '');
  const [stageScrolling, setStageScrolling] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Map<string, HTMLElement>>(new Map());
  const chipDrivenScrollRef = useRef(false);
  const scrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = useMemo(
    () => tours.find((t) => t.id === activeId) ?? tours[0] ?? null,
    [activeId, tours],
  );

  const descriptionParagraphs = useMemo(() => {
    const raw = landing?.description?.trim() ?? '';
    if (!raw) return [];
    return raw
      .split(/\n{2,}/)
      .map((p) => fixRussianHangingPrepositions(p.trim()))
      .filter(Boolean);
  }, [landing?.description]);

  const setSlideRef = useCallback((id: string, node: HTMLElement | null) => {
    if (node) slideRefs.current.set(id, node);
    else slideRefs.current.delete(id);
  }, []);

  const resolveActiveTourId = useCallback((): string | null => {
    const stage = stageRef.current;
    if (!stage || tours.length === 0) return null;

    const stageRect = stage.getBoundingClientRect();
    // Точка привязки ближе к левому краю трека (snap-start + peek справа)
    const anchorX = stageRect.left + Math.min(120, stageRect.width * 0.22);

    let bestId: string | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const tour of tours) {
      const el = slideRefs.current.get(tour.id);
      if (!el?.isConnected) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) continue;

      const visibleLeft = Math.max(rect.left, stageRect.left);
      const visibleRight = Math.min(rect.right, stageRect.right);
      const visibleWidth = Math.max(0, visibleRight - visibleLeft);
      const visibility = visibleWidth / rect.width;
      if (visibility < 0.18) continue;

      // Предпочитаем карточку, чей левый край ближе к якорю, с бонусом за видимость
      const edgeDist = Math.abs(rect.left - anchorX);
      const score = edgeDist - visibility * 80;
      if (score < bestScore) {
        bestScore = score;
        bestId = tour.id;
      }
    }

    return bestId ?? tours[0]?.id ?? null;
  }, [tours]);

  const syncActiveFromScroll = useCallback(() => {
    if (chipDrivenScrollRef.current) return;
    const nextId = resolveActiveTourId();
    if (!nextId) return;
    setActiveId((prev) => (prev === nextId ? prev : nextId));
  }, [resolveActiveTourId]);

  const scrollToTour = useCallback((id: string) => {
    const stage = stageRef.current;
    const el = slideRefs.current.get(id);
    if (!stage || !el || !el.isConnected) return;
    chipDrivenScrollRef.current = true;
    setStageScrolling(true);
    const pad = Number.parseFloat(getComputedStyle(stage).scrollPaddingLeft) || 0;
    const x =
      el.getBoundingClientRect().left -
      stage.getBoundingClientRect().left +
      stage.scrollLeft -
      pad;
    stage.scrollTo({ left: Math.max(0, x), behavior: 'smooth' });
  }, []);

  const selectTourFromChip = useCallback(
    (id: string) => {
      setActiveId(id);
      scrollToTour(id);
    },
    [scrollToTour],
  );

  const activeIndex = useMemo(
    () => Math.max(0, tours.findIndex((t) => t.id === (active?.id ?? ''))),
    [active?.id, tours],
  );
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < tours.length - 1;

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    selectTourFromChip(tours[activeIndex - 1]!.id);
  }, [activeIndex, canGoPrev, selectTourFromChip, tours]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    selectTourFromChip(tours[activeIndex + 1]!.id);
  }, [activeIndex, canGoNext, selectTourFromChip, tours]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || tours.length === 0) return;

    // snap не должен уезжать со стартовой сетки
    stage.scrollLeft = 0;

    let raf = 0;
    const onScroll = () => {
      setStageScrolling(true);
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        syncActiveFromScroll();
      });
      if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
      scrollStopTimerRef.current = setTimeout(() => {
        setStageScrolling(false);
        chipDrivenScrollRef.current = false;
        syncActiveFromScroll();
      }, 160);
    };

    stage.addEventListener('scroll', onScroll, { passive: true });
    syncActiveFromScroll();

    return () => {
      stage.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
    };
  }, [tours, syncActiveFromScroll]);

  return (
    <Root
      className={`${styles.pageSection} ${isHome ? styles.pageSectionHome : styles.pageSectionListing}`}
      aria-label={isHome ? undefined : 'Туры в Китай'}
    >
      {!isHome || tours.length > 0 ? (
        <div className="padding-global">
          {!isHome ? (
            <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
              <Link href="/" className={styles.breadcrumbsLink}>
                Главная
              </Link>
              <span className={styles.breadcrumbsSep}>/</span>
              <span className={styles.breadcrumbsCurrent}>Туры в Китай</span>
            </nav>
          ) : null}

          {tours.length > 0 ? (
            <ul className={styles.dateChips}>
              {tours.map((t) => {
                const activeChip = t.id === (active?.id ?? '');
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={`h5 ${styles.dateChip}${activeChip ? ` ${styles.dateChipActive}` : ''}`}
                      onClick={() => selectTourFromChip(t.id)}
                      aria-pressed={activeChip}
                    >
                      {activeChip ? <DateChipHandOutline /> : null}
                      <span className={styles.dateChipLabel}>
                        {formatTourDateChip(t.startsAt, t.endsAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/*
        Трек на всю ширину page (не внутри padding-global).
        Спейсер = формула сетки; padding-left нельзя — snap его съедает.
      */}
      <div className={styles.trackShell}>
        {tours.length > 1 ? (
          <div className={styles.trackArrows} role="group" aria-label="Навигация по турам">
            <button
              type="button"
              className={styles.trackArrow}
              onClick={goPrev}
              disabled={!canGoPrev}
              aria-label="Предыдущий тур"
            >
              <img
                src="/icons/arrow.svg"
                alt=""
                className={styles.trackArrowIcon}
                aria-hidden
              />
            </button>
            <button
              type="button"
              className={styles.trackArrow}
              onClick={goNext}
              disabled={!canGoNext}
              aria-label="Следующий тур"
            >
              <img
                src="/icons/arrow.svg"
                alt=""
                className={styles.trackArrowIconNext}
                aria-hidden
              />
            </button>
          </div>
        ) : null}

        <div className={styles.layoutTrack} ref={stageRef}>
          <div className={styles.trackGridPad} aria-hidden />
          <aside className={styles.intro}>
            <IntroTitleTag className={`h1 ${styles.introTitle}`}>
              {renderIntroTitle(landing?.title)}
            </IntroTitleTag>
            {landing?.imageUrl ? (
              <TourMediaImage
                className={styles.introImage}
                url={landing.imageUrl}
                alt="Туры в Китай — WUPAPA"
                width={403}
                height={253}
                sizes="(max-width: 768px) 100vw, 403px"
              />
            ) : null}
            {descriptionParagraphs.map((p, i) => (
              <p key={i} className={`text-body-long ${styles.introText}`}>
                {p}
              </p>
            ))}
          </aside>

          {tours.length === 0 ? (
            <p className={styles.empty}>Скоро опубликуем ближайшие туры.</p>
          ) : (
            tours.map((tour) => {
              const isActive = tour.id === (active?.id ?? '');
              const tourHref = `/tours/${encodeURIComponent(tour.slug)}`;
              return (
                <article
                  key={tour.id}
                  data-tour-id={tour.id}
                  ref={(node) => setSlideRef(tour.id, node)}
                  className={`${styles.cardSlide}${isActive ? ` ${styles.cardSlideActive}` : ''}`}
                >
                  <Link
                    href={tourHref}
                    className={styles.cardSlideLink}
                    aria-label={`Открыть тур «${tour.title}»`}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        goPrev();
                      }
                      if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        goNext();
                      }
                    }}
                  >
                    <div className={styles.collage}>
                      {tour.cardPrimaryUrl ? (
                        <TourMediaImage
                          className={styles.collagePrimary}
                          url={tour.cardPrimaryUrl}
                          alt={`Тур «${tour.title}» — основное фото`}
                          width={560}
                          height={420}
                          sizes="(max-width: 720px) 88vw, min(62vw, 560px)"
                        />
                      ) : (
                        <div className={styles.collagePlaceholder} />
                      )}
                      {tour.cardSecondaryUrl ? (
                        <TourMediaImage
                          className={`${styles.collageSecondary}${stageScrolling ? ` ${styles.collageSecondaryFlat}` : ''}`}
                          url={tour.cardSecondaryUrl}
                          alt={`Тур «${tour.title}» — дополнительное фото`}
                          width={280}
                          height={360}
                          sizes="(max-width: 720px) 40vw, 280px"
                        />
                      ) : null}
                    </div>

                    <div className={styles.cardMeta}>
                      <CardTitleTag className={`h2 ${styles.cardTitle}`}>{tour.title}</CardTitleTag>
                      <span className={`text-card-16-400 ${styles.seats}`}>
                        <SeatsIcon />
                        {tour.seatsTaken}/{tour.seatsTotal}
                      </span>
                    </div>

                    <div className={styles.cardBottom}>
                      {tour.cardText ? (
                        <p className={`text-body-long ${styles.cardText}`}>
                          {fixRussianHangingPrepositions(tour.cardText)}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className={styles.roundLink} aria-hidden>
                        <RoundLinkHandOutline />
                        <svg
                          className={styles.roundLinkIcon}
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M5 12h14M13 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })
          )}
        </div>
      </div>
    </Root>
  );
}
