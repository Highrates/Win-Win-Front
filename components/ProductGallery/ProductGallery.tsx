'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/dist/photoswipe.css';
import './ProductGalleryPhotoswipe.css';
import styles from './ProductGallery.module.css';

const ASPECT_RATIO = 1 / 1.074;
const IMG_WIDTH = 1024;
const IMG_HEIGHT = Math.round(IMG_WIDTH / ASPECT_RATIO);

const SLOTS = 6; // 0: left big, 1: center big, 2-5: right 2x2
const TRANSITION_MS = 450;
const EASING = 'cubic-bezier(0.65, 0.05, 0.36, 1)';
const FALLBACK_IMG = '/images/placeholder.svg';

export interface ProductGalleryProps {
  images: string[];
  /** Optional product name for aria-labels */
  productName?: string;
}

function ensureMinimumImages(images: string[], min: number): string[] {
  if (images.length >= min) return images;
  const out = [...images];
  while (out.length < min) {
    out.push(images[out.length % images.length]);
  }
  return out;
}

export function ProductGallery({ images: rawImages, productName = 'Товар' }: ProductGalleryProps) {
  const { images, compactRight } = useMemo(() => {
    const base = rawImages.length > 0 ? rawImages : [FALLBACK_IMG];
    const compact = base.length <= 3;
    const minSlots = compact ? Math.max(1, base.length) : SLOTS;
    return {
      images: ensureMinimumImages(base, minSlots),
      compactRight: compact,
    };
  }, [rawImages]);
  const N = images.length;

  const [offset, setOffset] = useState(0);
  const [prevOffset, setPrevOffset] = useState(0);
  const [slideActive, setSlideActive] = useState(false);
  /** next: 0 → -50 (контент уходит влево); prev: -50 → 0 (контент приходит слева) */
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [slideTranslate, setSlideTranslate] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const transitionMsRef = useRef<number>(TRANSITION_MS);
  const galleryImagesSignature = useMemo(() => JSON.stringify(rawImages), [rawImages]);
  const prevGalleryImagesSigRef = useRef<string | null>(null);

  /** После смены варианта/размера (другой набор URL) — прокрутка к галерее */
  useEffect(() => {
    if (prevGalleryImagesSigRef.current === null) {
      prevGalleryImagesSigRef.current = galleryImagesSignature;
      return;
    }
    if (prevGalleryImagesSigRef.current === galleryImagesSignature) return;
    prevGalleryImagesSigRef.current = galleryImagesSignature;
    const el = galleryRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [galleryImagesSignature]);

  const dataSource = useMemo(
    () =>
      images.map((src) => ({
        src,
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
      })),
    [images]
  );

  const go = useCallback(
    (delta: number) => {
      if (slideActive) return;
      const nextOffset = (offset + delta + N) % N;
      const direction: 'next' | 'prev' = delta > 0 ? 'next' : 'prev';
      transitionMsRef.current = TRANSITION_MS;
      flushSync(() => {
        setPrevOffset(offset);
        setOffset(nextOffset);
        setSlideDirection(direction);
        setSlideTranslate(direction === 'next' ? 0 : -50);
        setSlideActive(true);
      });
    },
    [N, offset, slideActive]
  );

  useLayoutEffect(() => {
    if (!slideActive) return;
    const target = slideDirection === 'next' ? -50 : 0;
    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      if (cancelled) return;
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        setSlideTranslate(target);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [slideActive, slideDirection]);

  useEffect(() => {
    if (!slideActive) return;
    const duration = transitionMsRef.current;
    const t = setTimeout(() => {
      setSlideActive(false);
      setPrevOffset(offset);
      setSlideTranslate(0);
    }, duration);
    return () => clearTimeout(t);
  }, [slideActive, offset]);

  const goNext = useCallback(() => go(1), [go]);
  const goPrev = useCallback(() => go(-1), [go]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index === offset || slideActive) return;
      const forward = (index - offset + N) % N;
      const backward = (offset - index + N) % N;
      const direction: 'next' | 'prev' = forward <= backward ? 'next' : 'prev';
      transitionMsRef.current = TRANSITION_MS;
      flushSync(() => {
        setPrevOffset(offset);
        setOffset(index);
        setSlideDirection(direction);
        setSlideTranslate(direction === 'next' ? 0 : -50);
        setSlideActive(true);
      });
    },
    [offset, slideActive, N]
  );

  const dotTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const handleDotKeyDown = useCallback(
    (e: React.KeyboardEvent, i: number) => {
      let next: number | null = null;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next = (i + 1) % N;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        next = (i - 1 + N) % N;
      } else if (e.key === 'Home') {
        e.preventDefault();
        next = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        next = N - 1;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        goToIndex(i);
        return;
      }
      if (next !== null) {
        goToIndex(next);
        dotTabRefs.current[next]?.focus();
      }
    },
    [N, goToIndex]
  );

  const touchStartX = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    didSwipeRef.current = false;
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const endX = e.changedTouches[0].clientX;
      const delta = touchStartX.current - endX;
      touchStartX.current = null;
      const threshold = 50;
      if (delta > threshold) {
        didSwipeRef.current = true;
        goNext();
      } else if (delta < -threshold) {
        didSwipeRef.current = true;
        goPrev();
      }
    },
    [goNext, goPrev]
  );
  const openFullscreen = useCallback(
    (slotIndex: number) => {
      const globalIndex = (offset + slotIndex) % N;
      const pswp = new PhotoSwipe({
        dataSource,
        index: globalIndex,
        loop: true,
        arrowKeys: true,
        escKey: true,
        trapFocus: true,
        returnFocus: true,
        wheelToZoom: true,
        padding: { top: 16, bottom: 16, left: 16, right: 16 },
        mainClass: 'pswp--winwin',
      });
      pswp.on('close', () => {
        try {
          pswp.destroy();
        } catch {
          // ignore
        }
      });
      pswp.init();
    },
    [offset, N, dataSource]
  );

  const handleSlotClick = useCallback(
    (e: React.MouseEvent, slotIndex: number) => {
      if (didSwipeRef.current) {
        e.preventDefault();
        didSwipeRef.current = false;
        return;
      }
      openFullscreen(slotIndex);
    },
    [openFullscreen]
  );

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target !== el && !el.contains(e.target as Node)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPrev, goNext]);

  const indices = useMemo(
    () =>
      Array.from({ length: SLOTS }, (_, i) => (offset + i) % N),
    [offset, N]
  );

  const prevIndices = useMemo(
    () =>
      Array.from({ length: SLOTS }, (_, i) => (prevOffset + i) % N),
    [prevOffset, N]
  );

  function renderSlotImage(slotIndex: number, imgIndex: number, cell: 'a' | 'b') {
    return (
      <img
        key={`${slotIndex}-${cell}-${imgIndex}`}
        src={images[imgIndex]}
        alt=""
        width={IMG_WIDTH}
        height={IMG_HEIGHT}
        className={styles.galleryImg}
        loading="eager"
        decoding="async"
        onError={(e) => {
          const el = e.currentTarget;
          if (el.src !== FALLBACK_IMG) el.src = FALLBACK_IMG;
        }}
      />
    );
  }

  function renderSlot(slotIndex: number) {
    const isSliding = slideActive;
    let firstIndex: number;
    let secondIndex: number | null = null;
    if (!isSliding) {
      firstIndex = indices[slotIndex];
    } else if (slideDirection === 'next') {
      firstIndex = prevIndices[slotIndex];
      secondIndex = indices[slotIndex];
    } else {
      firstIndex = indices[slotIndex];
      secondIndex = prevIndices[slotIndex];
    }

    return (
      <button
        type="button"
        className={styles.galleryImageSlot}
        onClick={(e) => {
          e.preventDefault();
          handleSlotClick(e, slotIndex);
        }}
        aria-label={`Изображение ${slotIndex + 1} из ${N}, открыть в полном размере`}
      >
        <div className={styles.slotStripWrap}>
          <div
            className={isSliding ? styles.slotStrip : styles.slotStripIdle}
            style={
              isSliding
                ? {
                    ['--slot-duration' as string]: `${TRANSITION_MS}ms`,
                    ['--slot-easing' as string]: EASING,
                    transform: `translate3d(${slideTranslate}%, 0, 0)`,
                    /* Иначе браузер анимирует idle → -50% как «вперёд» и ломает «Назад» */
                    transition:
                      slideDirection === 'prev' && slideTranslate === -50 ? 'none' : undefined,
                  }
                : undefined
            }
          >
            <div className={styles.slotStripCell}>{renderSlotImage(slotIndex, firstIndex, 'a')}</div>
            {secondIndex !== null && (
              <div className={styles.slotStripCell}>{renderSlotImage(slotIndex, secondIndex, 'b')}</div>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      ref={galleryRef}
      id="gallery-panel"
      className={styles.productGallery}
      role="region"
      aria-label={`Галерея изображений: ${productName}`}
      aria-roledescription="карусель"
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        ['--gallery-transition-duration' as string]: `${TRANSITION_MS}ms`,
        ['--gallery-easing' as string]: EASING,
      }}
    >
      <div className={styles.galleryMain}>
        <div className={styles.galleryCol}>{renderSlot(0)}</div>
        <div className={`${styles.galleryCol} ${styles.galleryColCenter}`}>
          {renderSlot(1)}
          <div className={styles.galleryNav} aria-label="Навигация по галерее">
            <button
              type="button"
              className={styles.navBtnPrev}
              onClick={goPrev}
              disabled={slideActive}
              aria-label="Предыдущее изображение"
            >
              <img src="/icons/arrow.svg" alt="" className={styles.navArrowPrev} aria-hidden />
            </button>
            <div
              className={styles.galleryNavDots}
              role="tablist"
              aria-label="Номер изображения"
            >
              {Array.from({ length: N }, (_, i) => (
                <button
                  type="button"
                  key={i}
                  ref={(el) => { dotTabRefs.current[i] = el; }}
                  role="tab"
                  aria-selected={i === offset}
                  aria-controls="gallery-panel"
                  id={`gallery-tab-${i}`}
                  tabIndex={i === offset ? 0 : -1}
                  aria-label={`Изображение ${i + 1}`}
                  className={i === offset ? styles.navDotActive : styles.navDot}
                  onClick={() => goToIndex(i)}
                  onKeyDown={(e) => handleDotKeyDown(e, i)}
                />
              ))}
            </div>
            <button
              type="button"
              className={styles.navBtnNext}
              onClick={goNext}
              disabled={slideActive}
              aria-label="Следующее изображение"
            >
              <img src="/icons/arrow.svg" alt="" className={styles.navArrowNext} aria-hidden />
            </button>
          </div>
        </div>
        <div
          className={`${styles.galleryColRight} ${compactRight ? styles.galleryColRightCompact : ''}`}
        >
          <div
            className={`${styles.galleryThumbs} ${compactRight ? styles.galleryThumbsCompact : ''}`}
          >
            {compactRight ? (
              <div className={`${styles.galleryThumbSlot} ${styles.galleryThumbSlotFirst}`}>
                <button
                  type="button"
                  className={styles.thumbZoomBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openFullscreen(2);
                  }}
                  aria-label="Открыть галерею во весь экран"
                >
                  <img src="/icons/zoom-in.svg" alt="" aria-hidden />
                </button>
                {renderSlot(2)}
              </div>
            ) : (
              [2, 3, 4, 5].map((slot) => (
                <div
                  key={slot}
                  className={
                    slot === 2
                      ? `${styles.galleryThumbSlot} ${styles.galleryThumbSlotFirst}`
                      : styles.galleryThumbSlot
                  }
                >
                  {slot === 2 && (
                    <button
                      type="button"
                      className={styles.thumbZoomBtn}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openFullscreen(2);
                      }}
                      aria-label="Открыть галерею во весь экран"
                    >
                      <img src="/icons/zoom-in.svg" alt="" aria-hidden />
                    </button>
                  )}
                  {renderSlot(slot)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
