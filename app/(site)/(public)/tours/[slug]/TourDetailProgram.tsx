'use client';

import Image from 'next/image';
import type { Ref } from 'react';
import { tourImageUnoptimized } from '@/lib/chinaTours/tourImage';
import type { ChinaTourDetailDay } from '@/lib/chinaTours/types';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import shared from '../tours.module.css';
import styles from './tourDetail.module.css';

type Props = {
  tourTitle: string;
  day: ChinaTourDetailDay | null;
  daySwapClass: string;
  mediaStageClass: string;
  galleryUrls: string[];
  thumbUrls: string[];
  slideIndex: number;
  thumbsVisible: boolean;
  timelineScrollRef: Ref<HTMLDivElement>;
  onSelectThumb: (url: string) => void;
};

function TourMediaImage({
  url,
  alt,
  className,
  width,
  height,
  sizes,
  draggable,
}: {
  url: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  sizes: string;
  draggable?: boolean;
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
      draggable={draggable}
    />
  );
}

export function TourDetailProgram({
  tourTitle,
  day,
  daySwapClass,
  mediaStageClass,
  galleryUrls,
  thumbUrls,
  slideIndex,
  thumbsVisible,
  timelineScrollRef,
  onSelectThumb,
}: Props) {
  return (
    <>
      <div className={styles.program}>
        {day ? (
          <div key={day.id} className={daySwapClass}>
            <h2 className={`h2 ${styles.dayHeading}`}>
              {day.title?.trim() || `День ${day.dayNumber}`}
            </h2>
            {day.subtitle ? <p className={`h5 ${styles.daySub}`}>{day.subtitle}</p> : null}
            <div className={styles.timelineScroll} ref={timelineScrollRef}>
              <ul className={styles.timeline}>
                {day.items.map((it) => (
                  <li key={it.id} className={styles.timeRow}>
                    <div className={styles.timeCol}>
                      <span className={`text-caption ${styles.timeLabel}`}>{it.timeLabel}</span>
                      <span className={styles.timeRail} aria-hidden />
                    </div>
                    <div className={styles.timeContent}>
                      {it.title ? (
                        <p className={`text-card-16-500 ${styles.timeTitle}`}>{it.title}</p>
                      ) : null}
                      {it.body ? (
                        /<[a-z][\s\S]*>/i.test(it.body) ? (
                          <div
                            className={`text-body-long ${styles.timeBody}`}
                            dangerouslySetInnerHTML={{ __html: it.body }}
                          />
                        ) : (
                          <p className={`text-body-long ${styles.timeBody}`}>{it.body}</p>
                        )
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className={`text-body ${shared.empty}`}>Программа появится позже.</p>
        )}
      </div>

      <div className={styles.dayMedia}>
        <div className={styles.dayMediaInner}>
          <div key={day?.id ?? 'empty'} className={mediaStageClass}>
            {galleryUrls.length > 0 ? (
              <div className={styles.dayHeroViewport}>
                <div
                  className={styles.dayHeroTrack}
                  style={{ transform: `translate3d(-${slideIndex * 100}%, 0, 0)` }}
                >
                  {galleryUrls.map((url, i) => (
                    <TourMediaImage
                      key={url}
                      className={styles.dayHero}
                      url={url}
                      alt={`${tourTitle} — день ${day?.dayNumber ?? ''}, фото ${i + 1}`}
                      width={900}
                      height={1200}
                      sizes="(max-width: 960px) 100vw, 42vw"
                      draggable={false}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {thumbUrls.length > 0 ? (
            <div
              key={`thumbs-${day?.id ?? 'empty'}`}
              className={`${styles.dayThumbs}${thumbsVisible ? ` ${styles.dayThumbsVisible}` : ''}`}
            >
              {thumbUrls.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  className={styles.dayThumb}
                  onClick={() => onSelectThumb(url)}
                  aria-label={`Показать фото ${i + 1} тура «${tourTitle}»`}
                >
                  <TourMediaImage
                    className={styles.dayThumbImg}
                    url={url}
                    alt={`Превью фото ${i + 1} — ${tourTitle}`}
                    width={120}
                    height={160}
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
