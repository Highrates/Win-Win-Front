'use client';

import { Button } from '@/components/Button';
import type { ChinaTourDetail, ChinaTourMyReview } from '@/lib/chinaTours/types';
import shared from '../tours.module.css';
import styles from './tourDetail.module.css';

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
  return (
    <div className="padding-global">
      <section className={styles.reviews} aria-labelledby="tour-reviews">
        <h2 id="tour-reviews" className={`h3 ${styles.reviewsTitle}`}>
          Отзывы
        </h2>
        {reviews.length === 0 ? (
          <p className={`text-body ${shared.empty}`}>Пока нет опубликованных отзывов.</p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className={styles.reviewCard}>
              <p className={`text-caption ${styles.reviewMeta}`}>
                {r.authorName}
                {r.rating != null ? ` · ${r.rating}/5` : ''}
              </p>
              <p className={`text-body-long ${styles.reviewBody}`}>{r.body}</p>
            </article>
          ))
        )}

        {canLeaveReview && !myReview ? (
          <div
            className={styles.modal}
            style={{ marginTop: 24, boxShadow: 'none', border: '1px solid #eee' }}
          >
            <h3 style={{ margin: 0, fontSize: 16 }}>Оставить отзыв</h3>
            <label>
              Оценка
              <select
                value={reviewRating}
                onChange={(e) => onRatingChange(Number(e.target.value))}
                style={{ marginLeft: 8 }}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              value={reviewBody}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder="Как прошёл тур?"
            />
            {reviewMsg ? <p className={shared.empty}>{reviewMsg}</p> : null}
            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="primary"
                disabled={busy || reviewBody.trim().length < 2}
                onClick={onSubmit}
              >
                Отправить
              </Button>
            </div>
          </div>
        ) : null}
        {myReview ? (
          <p className={shared.empty} style={{ marginTop: 16 }}>
            Ваш отзыв:{' '}
            {myReview.status === 'PENDING'
              ? 'на модерации'
              : myReview.status === 'APPROVED'
                ? 'опубликован'
                : 'отклонён'}
          </p>
        ) : null}
      </section>
    </div>
  );
}
