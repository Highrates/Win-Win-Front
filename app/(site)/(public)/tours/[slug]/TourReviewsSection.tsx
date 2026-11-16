'use client';

import { useId } from 'react';
import { Button } from '@/components/Button';
import type { ChinaTourDetail, ChinaTourMyReview } from '@/lib/chinaTours/types';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import shared from '../tours.module.css';
import styles from './tourDetail.module.css';

const REVIEW_BODY_MAX = 4000;

type Props = {
  reviews: ChinaTourDetail['reviews'];
  canLeaveReview: boolean;
  myReview: ChinaTourMyReview;
  reviewBody: string;
  reviewRating: number;
  reviewMsg: string | null;
  busy: boolean;
  onBodyChange: (value: string) => void;
  onRatingChange: (value: number) => void;
  onSubmit: () => void;
};

function statusLabel(status: NonNullable<ChinaTourMyReview>['status']): string {
  if (status === 'PENDING') return 'на модерации';
  if (status === 'APPROVED') return 'опубликован';
  return 'отклонён';
}

export function TourReviewsSection({
  reviews,
  canLeaveReview,
  myReview,
  reviewBody,
  reviewRating,
  reviewMsg,
  busy,
  onBodyChange,
  onRatingChange,
  onSubmit,
}: Props) {
  const ratingId = useId();
  const bodyId = useId();
  const canRewrite = Boolean(myReview && myReview.status === 'REJECTED');
  const showForm = canLeaveReview && (!myReview || canRewrite);
  const showOwnCard = Boolean(myReview && myReview.status !== 'REJECTED');
  const bodyLen = reviewBody.length;

  return (
    <div className="padding-global">
      <section className={styles.reviews} aria-labelledby="tour-reviews">
        <h2 id="tour-reviews" className={`h3 ${styles.reviewsTitle}`}>
          Отзывы
        </h2>
        {reviews.length === 0 ? (
          <p className={`text-body ${shared.empty}`}>Пока нет опубликованных отзывов.</p>
        ) : (
          reviews.map((r) => {
            const photos = (r.photoUrls ?? []).map((u) => resolveMediaUrlForClient(u));
            const videoSrc = r.videoUrl ? resolveMediaUrlForClient(r.videoUrl) : null;
            return (
              <article key={r.id} className={styles.reviewCard}>
                <p className={`text-caption ${styles.reviewMeta}`}>
                  {r.authorName}
                  {r.rating != null ? ` · ${r.rating}/5` : ''}
                </p>
                {r.body?.trim() ? (
                  <p className={`text-body-long ${styles.reviewBody}`}>{r.body}</p>
                ) : null}
                {photos.length > 0 ? (
                  <ul className={styles.reviewPhotos}>
                    {photos.map((src) => (
                      <li key={src}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className={styles.reviewPhoto} src={src} alt="" loading="lazy" />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {videoSrc ? (
                  <video
                    className={styles.reviewVideo}
                    src={videoSrc}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : null}
              </article>
            );
          })
        )}

        {showOwnCard && myReview ? (
          <article className={styles.myReviewCard} aria-label="Ваш отзыв">
            <p className={`text-caption ${styles.reviewMeta}`}>
              Ваш отзыв · {statusLabel(myReview.status)}
              {myReview.rating != null ? ` · ${myReview.rating}/5` : ''}
            </p>
            {myReview.body?.trim() ? (
              <p className={`text-body-long ${styles.reviewBody}`}>{myReview.body}</p>
            ) : null}
            {myReview.status === 'PENDING' ? (
              <p className={`text-caption ${styles.myReviewHint}`}>
                После проверки отзыв появится в ленте.
              </p>
            ) : null}
          </article>
        ) : null}

        {showForm ? (
          <div className={styles.reviewForm}>
            <h3 className={styles.reviewFormTitle}>
              {canRewrite ? 'Переписать отзыв' : 'Оставить отзыв'}
            </h3>
            {canRewrite ? (
              <p className={`text-caption ${styles.myReviewHint}`}>
                Предыдущий отзыв отклонён. Отправьте новую версию — она снова уйдёт на модерацию.
              </p>
            ) : null}

            <div className={styles.reviewFormField}>
              <label className={styles.reviewFormLabel} htmlFor={ratingId}>
                Оценка
              </label>
              <select
                id={ratingId}
                className={styles.reviewFormSelect}
                value={reviewRating}
                onChange={(e) => onRatingChange(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.reviewFormField}>
              <label className={styles.reviewFormLabel} htmlFor={bodyId}>
                Текст отзыва
              </label>
              <textarea
                id={bodyId}
                className={styles.reviewFormTextarea}
                value={reviewBody}
                onChange={(e) => onBodyChange(e.target.value.slice(0, REVIEW_BODY_MAX))}
                placeholder="Как прошёл тур?"
                maxLength={REVIEW_BODY_MAX}
                rows={5}
              />
              <p className={`text-caption ${styles.reviewFormCounter}`} aria-live="polite">
                {bodyLen}/{REVIEW_BODY_MAX}
              </p>
            </div>

            {reviewMsg ? (
              <p className={styles.reviewFormMsg} role="alert" aria-live="assertive">
                {reviewMsg}
              </p>
            ) : null}

            <div className={styles.reviewFormActions}>
              <Button
                type="button"
                variant="primary"
                disabled={busy || reviewBody.trim().length < 2}
                onClick={onSubmit}
              >
                {canRewrite ? 'Отправить снова' : 'Отправить'}
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
