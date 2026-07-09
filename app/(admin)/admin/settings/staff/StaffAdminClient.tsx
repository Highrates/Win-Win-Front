'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ModeratorAssignableSectionId } from '@win-win/admin-sections';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { FlashBanner } from '@/components/FlashBanner/FlashBanner';
import {
  adminBackendFetch,
  adminBackendJson,
  readAdminApiError,
} from '@/lib/adminBackendFetch';
import { adminStaffPage, formatStaffLastLogin } from '@/lib/admin-i18n/adminStaffI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import { useAdminPermissions } from '@/lib/adminPermissions/AdminPermissionsProvider';
import { useFlashBanner } from '@/hooks/useFlashBanner';
import type {
  CreateStaffResponse,
  ResetStaffPasswordResponse,
  StaffAdminRow,
  StaffSectionCatalogItem,
} from '@/lib/adminStaffTypes';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import panelStyles from '../../settings/pricing/pricingSettings.module.css';
import staffStyles from './staffAdmin.module.css';
import { StaffAvatarField } from './StaffAvatarField';
import { StaffPasswordRevealModal } from './StaffPasswordRevealModal';

type EditorMode = 'create' | 'edit';

export function StaffAdminClient() {
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminStaffPage(locale), [locale]);
  const { refresh: refreshPermissions, userId } = useAdminPermissions();
  const { confirm } = useAdminConfirm();
  const { flash, pushSuccess, dismiss } = useFlashBanner();

  const [rows, setRows] = useState<StaffAdminRow[]>([]);
  const [sectionCatalog, setSectionCatalog] = useState<StaffSectionCatalogItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [sections, setSections] = useState<ModeratorAssignableSectionId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ emailSent: boolean } | null>(null);
  const [retryingPasswordEmail, setRetryingPasswordEmail] = useState(false);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const isSuperAdminRow = selected?.role === 'ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRows, catalog] = await Promise.all([
        adminBackendJson<StaffAdminRow[]>('settings/admin/staff'),
        adminBackendJson<{ assignable: StaffSectionCatalogItem[] }>(
          `settings/admin/staff/sections?locale=${locale}`,
        ),
      ]);
      setRows(staffRows);
      setSectionCatalog(catalog.assignable);
      setSelectedId((cur) => {
        if (mode === 'create') return cur;
        if (cur && staffRows.some((r) => r.id === cur)) return cur;
        return staffRows.find((r) => r.role === 'MODERATOR')?.id ?? staffRows[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errLoad);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [locale, mode, t.errLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (mode === 'create') {
      setEmail('');
      setDisplayName('');
      setAvatarUrl(null);
      setSections(sectionCatalog.map((item) => item.id));
      return;
    }
    if (!selected) return;
    setEmail(selected.email ?? '');
    setDisplayName(selected.staffDisplayName ?? '');
    setAvatarUrl(selected.staffAvatarUrl);
    setSections(
      selected.role === 'ADMIN'
        ? sectionCatalog.map((item) => item.id)
        : [...selected.adminSections],
    );
  }, [mode, selected, sectionCatalog]);

  function toggleSection(id: ModeratorAssignableSectionId) {
    if (isSuperAdminRow) return;
    setSections((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function selectAllSections() {
    setSections(sectionCatalog.map((item) => item.id));
  }

  function clearAllSections() {
    if (sectionCatalog.length === 0) return;
    setSections([sectionCatalog[0].id]);
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const res = await adminBackendJson<CreateStaffResponse>('settings/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          staffDisplayName: displayName.trim() || undefined,
          adminSections: sections,
        }),
      });
      setPasswordModal({ emailSent: res.emailSent === true });
      setMode('edit');
      await load();
      if (res.user.id === userId) await refreshPermissions();
      pushSuccess(t.createSuccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errCreate);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await adminBackendJson<StaffAdminRow>(`settings/admin/staff/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffDisplayName: displayName.trim() || null,
          ...(isSuperAdminRow ? {} : { adminSections: sections }),
        }),
      });
      await load();
      if (selected.id === userId) await refreshPermissions();
      pushSuccess(t.saveSuccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errSave);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!selected) return;
    if (selected.isActive) {
      const ok = await confirm({
        title: t.deactivateConfirmTitle,
        message: t.deactivateConfirmMessage,
        confirmLabel: t.deactivate,
        cancelLabel: t.cancel,
      });
      if (!ok) return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminBackendJson<StaffAdminRow>(`settings/admin/staff/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !selected.isActive }),
      });
      await load();
      if (selected.id === userId) await refreshPermissions();
      pushSuccess(selected.isActive ? t.deactivateSuccess : t.activateSuccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errSave);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarFile(file: File) {
    if (!selected) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminBackendFetch(`settings/admin/staff/${selected.id}/avatar`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        throw new Error(await readAdminApiError(res));
      }
      const row = (await res.json()) as StaffAdminRow;
      setAvatarUrl(row.staffAvatarUrl);
      await load();
      pushSuccess(t.avatarSuccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errAvatar);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleResetPassword() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminBackendJson<ResetStaffPasswordResponse>(
        `settings/admin/staff/${selected.id}/reset-password`,
        { method: 'POST' },
      );
      setPasswordModal({ emailSent: res.emailSent === true });
      if (res.emailSent) pushSuccess(t.resetPasswordSuccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errPassword);
    } finally {
      setSaving(false);
    }
  }

  async function handleRetryPasswordEmail() {
    if (!selected) return;
    setRetryingPasswordEmail(true);
    setError(null);
    try {
      const res = await adminBackendJson<ResetStaffPasswordResponse>(
        `settings/admin/staff/${selected.id}/reset-password`,
        { method: 'POST' },
      );
      setPasswordModal({ emailSent: res.emailSent === true });
      if (res.emailSent) pushSuccess(t.resetPasswordSuccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errPassword);
    } finally {
      setRetryingPasswordEmail(false);
    }
  }

  return (
    <>
      <FlashBanner flash={flash} onDismiss={dismiss} />
      <AdminListShell
        loading={loading}
        error={error}
        onRetry={() => void load()}
        loadingLabel={locale === 'zh' ? '加载中…' : 'Загрузка…'}
        isEmpty={false}
        wrapContent={false}
      >
        <div className={panelStyles.grid}>
          <section className={panelStyles.listPanel}>
            <div className={`${panelStyles.listHeader} ${staffStyles.staffListHeader}`}>
              <h2 className={catalogStyles.title}>{t.title}</h2>
              <AdminCompactBtn
                type="button"
                onClick={() => {
                  setMode('create');
                  setSelectedId(null);
                }}
              >
                {t.addStaff}
              </AdminCompactBtn>
            </div>
            {rows.length === 0 ? (
              <p className={catalogStyles.lead}>{t.emptyList}</p>
            ) : (
              <ul className={panelStyles.profileList}>
                {rows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className={`${panelStyles.profileItem} ${
                        selectedId === row.id && mode === 'edit' ? panelStyles.profileItemActive : ''
                      }`}
                      onClick={() => {
                        setMode('edit');
                        setSelectedId(row.id);
                      }}
                    >
                      <span className={panelStyles.profileName}>
                        {row.staffDisplayName || row.email || row.id}
                      </span>
                      <span className={panelStyles.profileMeta}>
                        {row.role === 'ADMIN' ? t.superAdmin : t.moderator}
                        {!row.isActive ? ` · ${t.inactive}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={panelStyles.formPanel}>
            {mode === 'create' || selected ? (
              <>
                <h2 className={catalogStyles.title}>
                  {mode === 'create' ? t.addStaff : selected?.staffDisplayName || selected?.email}
                </h2>

                <div className={panelStyles.profileFormFields}>
                  {mode === 'edit' && selected ? (
                    <StaffAvatarField
                      label={t.avatar}
                      previewUrl={avatarUrl}
                      uploading={uploadingAvatar}
                      onFileSelect={(file) => void handleAvatarFile(file)}
                    />
                  ) : null}
                  <AdminTextField
                    label={t.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={mode !== 'create'}
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

                {mode === 'edit' && selected ? (
                  <p className={`${catalogStyles.lead} ${catalogStyles.leadMt16}`}>
                    {t.role}: {selected.role === 'ADMIN' ? t.superAdmin : t.moderator}
                    {' · '}
                    {t.status}: {selected.isActive ? t.active : t.inactive}
                    {' · '}
                    {t.lastLogin}: {formatStaffLastLogin(selected.lastAdminLoginAt, locale, t.neverLoggedIn)}
                  </p>
                ) : null}

                {!isSuperAdminRow ? (
                  <div className={panelStyles.formSection}>
                    <div className={panelStyles.listHeader}>
                      <h2 className={`${catalogStyles.groupHeading} ${panelStyles.panelHeading}`}>
                        {t.sectionsHeading}
                      </h2>
                      <div className={catalogStyles.bulkGroup}>
                        <AdminCompactBtn type="button" onClick={selectAllSections}>
                          {t.selectAll}
                        </AdminCompactBtn>
                        <AdminCompactBtn
                          type="button"
                          onClick={clearAllSections}
                          disabled={sections.length <= 1}
                        >
                          {t.clearAll}
                        </AdminCompactBtn>
                      </div>
                    </div>
                    <div className={panelStyles.profileFormFields}>
                      {sectionCatalog.map((item) => {
                        const inputId = `staff-section-${item.id}`;
                        return (
                          <div key={item.id} className={catalogStyles.labelCheckboxRow}>
                            <AccountCheckbox
                              id={inputId}
                              className={catalogStyles.adminCheckboxForm}
                              checked={sections.includes(item.id)}
                              disabled={sections.includes(item.id) && sections.length <= 1}
                              onChange={() => toggleSection(item.id)}
                            />
                            <label htmlFor={inputId}>{item.label}</label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className={`${catalogStyles.formActions} ${panelStyles.profileFormActions}`}>
                  {mode === 'create' ? (
                    <AdminCompactBtn type="button" disabled={saving} onClick={() => void handleCreate()}>
                      {t.addStaff}
                    </AdminCompactBtn>
                  ) : (
                    <>
                      <AdminCompactBtn
                        type="button"
                        variant="accent"
                        disabled={saving || uploadingAvatar}
                        onClick={() => void handleSave()}
                      >
                        {t.save}
                      </AdminCompactBtn>
                      {selected?.isActive ? (
                        <AdminCompactBtn
                          type="button"
                          disabled={saving}
                          onClick={() => void handleResetPassword()}
                        >
                          {t.resetPassword}
                        </AdminCompactBtn>
                      ) : null}
                      {selected && selected.role !== 'ADMIN' ? (
                        <AdminCompactBtn
                          type="button"
                          disabled={saving}
                          onClick={() => void handleToggleActive()}
                        >
                          {selected.isActive ? t.deactivate : t.activate}
                        </AdminCompactBtn>
                      ) : null}
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className={catalogStyles.lead}>{t.emptyList}</p>
            )}
          </section>
        </div>
      </AdminListShell>

      <StaffPasswordRevealModal
        open={passwordModal != null}
        emailSent={passwordModal?.emailSent ?? false}
        onClose={() => setPasswordModal(null)}
        onRetry={selected ? () => void handleRetryPasswordEmail() : undefined}
        retrying={retryingPasswordEmail}
      />
    </>
  );
}
