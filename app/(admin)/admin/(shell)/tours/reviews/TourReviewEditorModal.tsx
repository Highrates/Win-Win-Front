'use client';

import { useEffect, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModal } from '@/components/admin/AdminModal/AdminModal';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { AdminSelect, AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import type { AdminChinaTourListItem, AdminChinaTourReview } from '../toursAdminTypes';
import styles from '../toursAdmin.module.css';

export type TourReviewEditorDraft = {
  tourId: string;
  authorName: string;
  body: string;
  rating: string;
  photoUrls: string[];
  videoUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  tours: AdminChinaTourListItem[];
  initial: TourReviewEditorDraft | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: TourReviewEditorDraft) => void;
};

export function emptyReviewDraft(tourId = ''): TourReviewEditorDraft {
  return {
    tourId,
    authorName: '',
    body: '',
    rating: '',
    photoUrls: [],
    videoUrl: '',
    status: 'APPROVED',
  };
}

export function draftFromReview(r: AdminChinaTourReview): TourReviewEditorDraft {
  return {
    tourId: r.tour.id,
    authorName: r.authorName ?? r.user?.name ?? '',
    body: r.body,
    rating: r.rating != null ? String(r.rating) : '',
    photoUrls: r.photoUrls ?? [],
    videoUrl: r.videoUrl ?? '',
    status: r.status,
  };
}

export function TourReviewEditorModal({
  open,
  mode,
  tours,
  initial,
  saving,
  error,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<TourReviewEditorDraft>(initial ?? emptyReviewDraft());
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);

  useEffect(() => {
    if (open && initial) setDraft(initial);
  }, [open, initial]);

  const canSave =
    Boolean(draft.tourId) &&
    (draft.body.trim().length >= 2 || draft.photoUrls.length > 0 || draft.videoUrl.trim().length > 0);

  return (
    <>
      <AdminModal
        open={open}
        wide
        title={mode === 'create' ? 'Новый отзыв' : 'Редактировать отзыв'}
        onClose={onClose}
        footer={
          <>
            <AdminCompactBtn type="button" variant="outline" disabled={saving} onClick={onClose}>
              Отмена
            </AdminCompactBtn>
            <AdminCompactBtn
              type="button"
              variant="accent"
              disabled={saving || !canSave}
              onClick={() => onSave(draft)}
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </AdminCompactBtn>
          </>
        }
      >
        {error ? <p className={catalogStyles.error}>{error}</p> : null}

        <AdminSelect
          label="Тур"
          value={draft.tourId}
          disabled={mode === 'edit'}
          onChange={(e) => setDraft((d) => ({ ...d, tourId: e.target.value }))}
        >
          <option value="">Выберите тур</option>
          {tours.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </AdminSelect>

        <AdminTextField
          label="Автор (как на витрине)"
          value={draft.authorName}
          onChange={(e) => setDraft((d) => ({ ...d, authorName: e.target.value }))}
          placeholder="Имя участника"
        />

        <AdminSelect
          label="Оценка"
          value={draft.rating}
          onChange={(e) => setDraft((d) => ({ ...d, rating: e.target.value }))}
        >
          <option value="">Без оценки</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={String(n)}>
              {n}/5
            </option>
          ))}
        </AdminSelect>

        <AdminTextArea
          label="Текст"
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          rows={5}
          placeholder="Текст отзыва (необязателен, если есть фото/видео)"
        />

        <AdminSelect
          label="Статус"
          value={draft.status}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              status: e.target.value as TourReviewEditorDraft['status'],
            }))
          }
        >
          <option value="APPROVED">Опубликован</option>
          <option value="PENDING">На модерации</option>
          <option value="REJECTED">Отклонён</option>
        </AdminSelect>

        <div>
          <h3 className={catalogStyles.groupHeading}>Фото</h3>
          {draft.photoUrls.length > 0 ? (
            <ul className={styles.reviewMediaList}>
              {draft.photoUrls.map((url) => (
                <li key={url} className={styles.reviewMediaItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className={styles.reviewMediaThumb} />
                  <AdminCompactBtn
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        photoUrls: d.photoUrls.filter((u) => u !== url),
                      }))
                    }
                  >
                    Убрать
                  </AdminCompactBtn>
                </li>
              ))}
            </ul>
          ) : (
            <p className={catalogStyles.muted}>Фото не выбраны</p>
          )}
          <div className={catalogStyles.coverActions}>
            <AdminCompactBtn type="button" onClick={() => setPhotoPickerOpen(true)}>
              Добавить фото
            </AdminCompactBtn>
          </div>
        </div>

        <div>
          <h3 className={catalogStyles.groupHeading}>Видео</h3>
          {draft.videoUrl ? (
            <div className={styles.reviewMediaItem}>
              <video
                className={styles.reviewMediaVideo}
                src={draft.videoUrl}
                controls
                preload="metadata"
              />
              <AdminCompactBtn
                type="button"
                variant="outline"
                onClick={() => setDraft((d) => ({ ...d, videoUrl: '' }))}
              >
                Убрать
              </AdminCompactBtn>
            </div>
          ) : (
            <p className={catalogStyles.muted}>Видео не выбрано</p>
          )}
          <div className={catalogStyles.coverActions}>
            <AdminCompactBtn type="button" onClick={() => setVideoPickerOpen(true)}>
              Выбрать видео
            </AdminCompactBtn>
          </div>
        </div>
      </AdminModal>

      <MediaLibraryPickerModal
        open={photoPickerOpen}
        mediaFilter="image"
        onClose={() => setPhotoPickerOpen(false)}
        onPickBatch={(items) => {
          setDraft((d) => {
            const next = [...d.photoUrls];
            for (const it of items) {
              if (!next.includes(it.url) && next.length < 12) next.push(it.url);
            }
            return { ...d, photoUrls: next };
          });
          setPhotoPickerOpen(false);
        }}
      />

      <MediaLibraryPickerModal
        open={videoPickerOpen}
        mediaFilter="video"
        onClose={() => setVideoPickerOpen(false)}
        onPick={(sel) => {
          setDraft((d) => ({ ...d, videoUrl: sel.url }));
          setVideoPickerOpen(false);
        }}
      />
    </>
  );
}
