'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import {
  adminBackendFetch,
  adminBackendJson,
  readAdminApiError,
} from '@/lib/adminBackendFetch';
import { useAdminLogout } from '@/lib/adminAuth/useAdminLogout';
import { adminChromeStrings } from '@/lib/admin-i18n/adminChromeI18n';
import { adminStaffMePage, formatStaffLastLogin } from '@/lib/admin-i18n/adminStaffI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminPermissions } from '@/lib/adminPermissions/AdminPermissionsProvider';
import type { StaffAdminRow } from '@/lib/adminStaffTypes';
import catalogStyles from '../../../catalog/catalogAdmin.module.css';
import panelStyles from '../../pricing/pricingSettings.module.css';
import { StaffAvatarField } from '../StaffAvatarField';

export function StaffMeClient() {
  const logout = useAdminLogout();
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminStaffMePage(locale), [locale]);
  const chrome = useMemo(() => adminChromeStrings(locale), [locale]);
  const { refresh: refreshPermissions, isSuperAdmin } = useAdminPermissions();

  const [profile, setProfile] = useState<StaffAdminRow | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await adminBackendJson<StaffAdminRow>('settings/admin/staff/me');
      setProfile(row);
      setDisplayName(row.staffDisplayName ?? '');
      setAvatarUrl(row.staffAvatarUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errLoad);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [t.errLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const row = await adminBackendJson<StaffAdminRow>('settings/admin/staff/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffDisplayName: displayName.trim() || null }),
      });
      setProfile(row);
      setDisplayName(row.staffDisplayName ?? '');
      setAvatarUrl(row.staffAvatarUrl);
      await refreshPermissions();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errSave);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarFile(file: File) {
    setUploadingAvatar(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminBackendFetch('settings/admin/staff/me/avatar', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        throw new Error(await readAdminApiError(res));
      }
      const row = (await res.json()) as StaffAdminRow;
      setProfile(row);
      setAvatarUrl(row.staffAvatarUrl);
      await refreshPermissions();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errAvatar);
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <AdminListShell
      loading={loading}
      error={error}
      onRetry={() => void load()}
      loadingLabel={locale === 'zh' ? '加载中…' : 'Загрузка…'}
      isEmpty={false}
      wrapContent={false}
    >
      {profile ? (
        <section className={panelStyles.formPanel}>
          <h2 className={catalogStyles.title}>{profile.staffDisplayName || profile.email || t.title}</h2>

          <div className={panelStyles.profileFormFields}>
            <StaffAvatarField
              label={t.avatar}
              previewUrl={avatarUrl}
              uploading={uploadingAvatar}
              hint={t.avatarHint}
              onFileSelect={(file) => void handleAvatarFile(file)}
            />
            <AdminTextField
              label={t.email}
              value={profile.email ?? ''}
              disabled
              type="email"
              autoComplete="off"
            />
            <AdminTextField
              label={t.displayName}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <p className={`${catalogStyles.lead} ${catalogStyles.leadMt16}`}>
            {t.role}: {isSuperAdmin ? t.superAdmin : t.moderator}
            {' · '}
            {t.status}: {profile.isActive ? t.active : t.inactive}
            {' · '}
            {t.lastLogin}: {formatStaffLastLogin(profile.lastAdminLoginAt, locale, t.neverLoggedIn)}
          </p>

          <div className={`${catalogStyles.formActions} ${panelStyles.profileFormActions}`}>
            <AdminCompactBtn
              type="button"
              variant="accent"
              disabled={saving || uploadingAvatar}
              onClick={() => void handleSave()}
            >
              {t.save}
            </AdminCompactBtn>
            <AdminCompactBtn type="button" onClick={() => void logout()}>
              {chrome.logout}
            </AdminCompactBtn>
          </div>
        </section>
      ) : null}
    </AdminListShell>
  );
}
