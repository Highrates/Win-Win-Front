'use client';

import PhotoSwipe from 'photoswipe';
import 'photoswipe/dist/photoswipe.css';
import '@/components/ProductGallery/ProductGalleryPhotoswipe.css';

function measureImage(src: string): Promise<{ src: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        src,
        width: img.naturalWidth || 1600,
        height: img.naturalHeight || 1200,
      });
    img.onerror = () => resolve({ src, width: 1600, height: 1200 });
    img.src = src;
  });
}

/** Полноэкранный просмотр как на карточке товара (PhotoSwipe + класс pswp--winwin). */
export async function openOrderChatPhotoSwipe(urls: string[], startIndex: number): Promise<void> {
  const clean = urls.map((u) => u.trim()).filter(Boolean);
  if (clean.length === 0) return;
  const index = Math.max(0, Math.min(startIndex, clean.length - 1));
  const dataSource = await Promise.all(clean.map((src) => measureImage(src)));

  const pswp = new PhotoSwipe({
    dataSource,
    index,
    loop: clean.length > 1,
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
      /* ignore */
    }
  });
  pswp.init();
}
