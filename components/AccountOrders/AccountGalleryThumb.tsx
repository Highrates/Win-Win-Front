'use client';

import { useMemo } from 'react';
import { openOrderChatPhotoSwipe } from '@/lib/orderChat/openOrderChatPhotoSwipe';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import thumbStyles from './AccountGalleryThumb.module.css';

function resolveUrl(url: string): string {
  return resolveMediaUrlForClient(url).trim();
}

export function resolveAccountGalleryUrls(urls: string[]): string[] {
  return urls.map(resolveUrl).filter(Boolean);
}

type Props = {
  src: string;
  galleryUrls: string[];
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
};

export function AccountGalleryThumb({ src, galleryUrls, className, width, height, alt = '' }: Props) {
  const resolvedSrc = resolveUrl(src);
  const resolvedGallery = useMemo(() => resolveAccountGalleryUrls(galleryUrls), [galleryUrls]);
  const idx = resolvedGallery.indexOf(resolvedSrc);

  if (idx < 0 || resolvedGallery.length === 0) {
    return (
      <img className={className} src={resolvedSrc} alt={alt} width={width} height={height} loading="lazy" />
    );
  }

  return (
    <button
      type="button"
      className={thumbStyles.btn}
      onClick={() => void openOrderChatPhotoSwipe(resolvedGallery, idx)}
      aria-label="Открыть фото"
    >
      <img className={className} src={resolvedSrc} alt={alt} width={width} height={height} loading="lazy" />
    </button>
  );
}
