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
  const images = useMemo(() => ensureMinimumImages(rawImages, SLOTS), [rawImages]);
  const N = images.length;

  const [offset, setOffset] = useState(0);
  const [prevOffset, setPrevOffset] = useState(0);
  const [slideActive, setSlideActive] = useState(false);
  const [slideTranslate, setSlideTranslate] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const slideTargetRef = useRef<number>(0);
  const transitionMsRef = useRef<number>(TRANSITION_MS);

  const dataSource = useMemo(
    () =>
      images.map((src) => ({
        src,
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
      })),
    [images]
  );

  /* Один эффект для обоих направлений: текущее уходит влево, новое приходит справа → strip [старое, новое], анимация 0% → -50%. */
  const go = useCallback(
    (delta: number) => {
      if (slideActive) return;
      const nextOffset = (offset + delta + N) % N;
      slideTargetRef.current = -50;
      transitionMsRef.current = TRANSITION_MS;
      flushSync(() => {
        setPrevOffset(offset);
        setOffset(nextOffset);
        setSlideTranslate(0);
        setSlideActive(true);
      });
    },
    [N, offset, slideActive]
  );

  useLayoutEffect(() => {
    if (!slideActive) return;
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlideTranslate(slideTargetRef.current);
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [slideActive]);

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

  function renderSlotImage(slotIndex: number, imgIndex: number) {
    return (
      <img
        src={images[imgIndex]}
        alt=""
        width={IMG_WIDTH}
        height={IMG_HEIGHT}
        className={styles.galleryImg}
        onError={(e) => {
          const el = e.currentTarget;
          if (el.src !== FALLBACK_IMG) el.src = FALLBACK_IMG;
        }}
      />
    );
  }

  function renderSlot(slotIndex: number) {
    const isSliding = slideActive;
    /* Один эффект: strip [старое, новое], анимация 0% → -50%. */
    const firstIndex = isSliding ? prevIndices[slotIndex] : indices[slotIndex];
    const secondIndex = isSliding ? indices[slotIndex] : null;

    return (
      <button
        type="button"
        className={styles.galleryImageSlot}
        onClick={(e) => {
          e.preventDefault();
          openFullscreen(slotIndex);
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
                    transform: `translateX(${slideTranslate}%)`,
                  }
                : undefined
            }
          >
            <div className={styles.slotStripCell}>{renderSlotImage(slotIndex, firstIndex)}</div>
            {secondIndex !== null && (
              <div className={styles.slotStripCell}>{renderSlotImage(slotIndex, secondIndex)}</div>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      ref={galleryRef}
      className={styles.productGallery}
      role="region"
      aria-label={`Галерея изображений: ${productName}`}
      aria-roledescription="карусель"
      tabIndex={0}
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
            <div className={styles.galleryNavDots} role="tablist" aria-label="Номер изображения">
              {Array.from({ length: N }, (_, i) => (
                <span
                  key={i}
                  role="tab"
                  aria-selected={i === offset}
                  aria-label={`Изображение ${i + 1}`}
                  className={i === offset ? styles.navDotActive : styles.navDot}
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
        <div className={styles.galleryColRight}>
          <div className={styles.galleryThumbs}>
            {[2, 3, 4, 5].map((slot) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
