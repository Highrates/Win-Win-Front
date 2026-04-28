import { useCallback } from 'react';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';

function publicUrlFromUploadResponse(j: unknown): string {
  if (!j || typeof j !== 'object') {
    throw new Error('Нет URL в ответе API');
  }
  const o = j as Record<string, unknown>;
  if (typeof o.publicUrl === 'string' && o.publicUrl.trim()) {
    return o.publicUrl.trim();
  }
  if (typeof o.url === 'string' && o.url.trim()) {
    return o.url.trim();
  }
  if (typeof o.avatarUrl === 'string' && o.avatarUrl.trim()) {
    return o.avatarUrl.trim();
  }
  if (o.profile && typeof o.profile === 'object' && o.profile !== null) {
    const p = o.profile as Record<string, unknown>;
    if (typeof p.avatarUrl === 'string' && p.avatarUrl.trim()) {
      return p.avatarUrl.trim();
    }
  }
  throw new Error('Нет URL в ответе API');
}

async function readProfileUploadFailMessage(res: Response, kind: 'avatar' | 'cover' | 'rich'): Promise<string> {
  const nested = await readApiErrorMessage(res);
  if (nested && nested !== (res.statusText || 'Ошибка запроса')) {
    return nested;
  }
  if (res.status === 413) {
    if (kind === 'avatar') return 'Аватар не больше 2 МБ';
    if (kind === 'cover') return 'Файл обложки не больше 5 МБ';
    return 'Файл больше 100 МБ';
  }
  return 'Не удалось загрузить файл';
}

export function useProfileUploads() {
  const postMultipart = useCallback(
    async (url: string, file: File, kind: 'avatar' | 'cover' | 'rich' = 'cover'): Promise<{ publicUrl: string }> => {
      const fd = new FormData();
      fd.set('file', file);
      const res = await fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error(await readProfileUploadFailMessage(res, kind));
      }
      const j: unknown = await res.json();
      return { publicUrl: publicUrlFromUploadResponse(j) };
    },
    [],
  );

  return { postMultipart, publicUrlFromUploadResponse };
}
