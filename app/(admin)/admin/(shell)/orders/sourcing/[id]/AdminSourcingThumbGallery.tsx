'use client';

import { useState } from 'react';
import { openOrderChatPhotoSwipe } from '@/lib/orderChat/openOrderChatPhotoSwipe';
import sd from './sourcingAdminDetail.module.css';

const BROKEN_THUMB_SRC = '/images/placeholder.svg';

export type AdminSourcingThumb = { id: string; src: string; alt: string };

/** Миниатюры с листаемой галереей (PhotoSwipe) в пределах одного набора — товара или вложений. */
export function AdminSourcingThumbGallery({ images }: { images: AdminSourcingThumb[] }) {
  const [broken, setBroken] = useState<Record<string, true>>({});
  const viewable = images.filter((img) => !broken[img.id]);
  const urls = viewable.map((img) => img.src);

  return (
    <div className={sd.thumbs}>
      {images.map((img) => {
        if (broken[img.id]) {
          return (
            <img
              key={img.id}
              src={BROKEN_THUMB_SRC}
              alt={`${img.alt} — не удалось загрузить`}
              title={`${img.alt} — не удалось загрузить`}
              className={sd.thumb}
            />
          );
        }
        return (
          <button
            key={img.id}
            type="button"
            className={sd.thumbBtn}
            onClick={() => void openOrderChatPhotoSwipe(urls, urls.indexOf(img.src))}
            aria-label={`Открыть фото: ${img.alt}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              className={sd.thumb}
              loading="lazy"
              onError={() => setBroken((prev) => ({ ...prev, [img.id]: true }))}
            />
          </button>
        );
      })}
    </div>
  );
}
