'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AccountErrorState } from '@/components/AccountErrorState/AccountErrorState';
import buttonStyles from '@/components/Button/Button.module.css';
import { TransitionLink } from '@/components/SiteTransition/TransitionLink';
import { accountLoadErrorText } from '@/lib/account/loadErrorMessage';
import { formatTourDateRange } from '@/lib/chinaTours/formatTourDate';
import { tourImageUnoptimized } from '@/lib/chinaTours/tourImage';
import type { ChinaTourMyApplicationListItem } from '@/lib/chinaTours/types';
import { fetchMyChinaTourApplications } from '@/lib/chinaTours/userApplicationsApi';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import { AccountToursPageSkeleton } from './AccountToursPageSkeleton';
import styles from './page.module.css';

function statusLabel(status: ChinaTourMyApplicationListItem['status']): string {
  if (status === 'PENDING') return 'На рассмотрении';
  if (status === 'ACCEPTED') return 'Принята';
  return 'Отклонена';
}

function statusClass(status: ChinaTourMyApplicationListItem['status']): string {
  if (status === 'ACCEPTED') return `${styles.badge} ${styles.badgeAccepted}`;
  if (status === 'REJECTED') return `${styles.badge} ${styles.badgeRejected}`;
  return styles.badge;
}

function SeatsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
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

export function AccountToursPageClient() {
  const [items, setItems] = useState<ChinaTourMyApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchMyChinaTourApplications());
    } catch (e: unknown) {
      setError(accountLoadErrorText(e, 'заявки на туры'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return <AccountToursPageSkeleton />;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Туры в Китай</h1>

      {error ? <AccountErrorState message={error} onRetry={() => void reload()} /> : null}

      {!error && items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            У вас пока нет заявок на туры. Посмотрите ближайшие программы и присоединяйтесь.
          </p>
          <TransitionLink
            href="/tours"
            className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
          >
            Смотреть туры
          </TransitionLink>
        </div>
      ) : null}

      {!error && items.length > 0 ? (
        <>
          <ul className={styles.list}>
            {items.map((a) => {
              const tourHref = `/tours/${encodeURIComponent(a.tour.slug)}`;
              const reviewHref = `${tourHref}#tour-reviews`;
              const thumbSrc = a.tour.cardPrimaryUrl
                ? resolveMediaUrlForClient(a.tour.cardPrimaryUrl)
                : null;

              const thumb = thumbSrc ? (
                <Image
                  className={styles.thumbImg}
                  src={thumbSrc}
                  alt=""
                  width={144}
                  height={144}
                  sizes="72px"
                  unoptimized={tourImageUnoptimized(thumbSrc)}
                />
              ) : (
                <div className={styles.thumbPlaceholder} aria-hidden />
              );

              const titleNode = a.tour.isPublished ? (
                <Link href={tourHref} className={styles.tourTitleLink}>
                  {a.tour.title}
                </Link>
              ) : (
                <span className={styles.tourTitle}>{a.tour.title}</span>
              );

              return (
                <li key={a.id}>
                  <article className={styles.card}>
                    <div className={styles.thumb}>{thumb}</div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTop}>
                        <h2 className={styles.tourTitleHeading}>{titleNode}</h2>
                        <p className={styles.dates}>
                          {formatTourDateRange(a.tour.startsAt, a.tour.endsAt)}
                        </p>
                      </div>
                      <div className={styles.meta}>
                        <span className={statusClass(a.status)}>{statusLabel(a.status)}</span>
                        <span className={styles.seats}>
                          <SeatsIcon />
                          {a.tour.seatsTaken}/{a.tour.seatsTotal}
                        </span>
                        <span className={styles.dates}>
                          Заявка от {new Date(a.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      {!a.tour.isPublished ? (
                        <p className={styles.unpublishedHint}>Снят с публикации</p>
                      ) : null}
                      {a.comment ? <p className={styles.comment}>{a.comment}</p> : null}
                      {a.canReview ? (
                        <Link href={reviewHref} className={styles.reviewLink}>
                          Оставить отзыв
                        </Link>
                      ) : null}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          <div className={styles.footerLink}>
            <TransitionLink
              href="/tours"
              className={`${buttonStyles.btn} ${buttonStyles.btnSecondary}`}
            >
              Все туры
            </TransitionLink>
          </div>
        </>
      ) : null}
    </div>
  );
}
