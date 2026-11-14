/**
 * next/image: оптимизируем same-origin (`/uploads`, `/images`).
 * Абсолютные http(s) (S3/CDN) — без remotePatterns → unoptimized.
 */
export function tourImageUnoptimized(src: string): boolean {
  const s = src.trim();
  if (!s) return true;
  if (s.startsWith('/uploads/') || s.startsWith('/images/')) return false;
  return /^https?:\/\//i.test(s);
}
