import { useCallback, useState } from 'react';
import type { ProfileDto } from '@/app/(account)/account/profile/profileTypes';
import { readApiErrorMessage } from '@/lib/readApiErrorMessage';

/**
 * Загрузка и PATCH `/api/user/profile` без лишних мутаций на GET (бэкенд читает профиль только из БД).
 */
export function useAccountProfile() {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/user/profile', { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) {
        setLoadError(await readApiErrorMessage(res));
        setProfile(null);
        return null;
      }
      const data = (await res.json()) as ProfileDto;
      setProfile(data);
      return data;
    } catch {
      setLoadError('Не удалось загрузить профиль');
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const patchProfile = useCallback(async (patch: Record<string, unknown>): Promise<ProfileDto> => {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res));
    }
    const next = (await res.json()) as ProfileDto;
    setProfile(next);
    return next;
  }, []);

  return {
    profile,
    setProfile,
    loading,
    loadError,
    loadProfile,
    patchProfile,
    saving,
    setSaving,
    saveError,
    setSaveError,
  };
}
