'use client';

import { useEffect, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminPillBadge } from '@/components/AdminPillChip/AdminPillChip';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { ADMIN_PROFILE_PRIMARY_LABEL } from '@/lib/adminProfilePrimary';
import type { ReferralProgramProfileRow } from '@/lib/adminUserGroupProfilesTypes';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import {
  adminQueryKeys,
  useAdminList,
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import panelStyles from '../settings/pricing/pricingSettings.module.css';

export function ReferralProgramProfilesPanel() {
  const invalidate = useInvalidateAdminQueries();
  const { confirm } = useAdminConfirm();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [lvl1, setLvl1] = useState('');
  const [lvl2, setLvl2] = useState('');
  const [minRub, setMinRub] = useState('');
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { rows: profiles, loading, error: listError, refetch } = useAdminList<ReferralProgramProfileRow>({
    queryKey: adminQueryKeys.referrals.profiles,
    page: 1,
    errorFallback: 'Не удалось загрузить профили',
    queryFn: async () => {
      const items = await adminBackendJson<ReferralProgramProfileRow[]>(
        'settings/admin/referral-program-profiles',
      );
      return {
        items,
        total: items.length,
        page: 1,
        limit: Math.max(items.length, 1),
      };
    },
  });

  const error = mutationError ?? listError;
  const selected = profiles.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    setSelectedId((cur) => {
      if (cur && profiles.some((r) => r.id === cur)) return cur;
      return profiles.find((r) => r.isDefault)?.id ?? profiles[0]?.id ?? null;
    });
  }, [profiles]);

  useEffect(() => {
    if (!selected) {
      setName('');
      setLvl1('');
      setLvl2('');
      setMinRub('');
      return;
    }
    setName(selected.name);
    setLvl1(String(selected.level1Percent));
    setLvl2(String(selected.level2Percent));
    setMinRub(String(selected.minimumOrderSiteTotalRub));
  }, [selected]);

  async function refreshProfiles() {
    await invalidate(adminQueryKeys.referrals.all);
    await refetch();
  }

  async function createProfile() {
    setSaving(true);
    setMutationError(null);
    try {
      const row = await adminBackendJson<ReferralProgramProfileRow>(
        'settings/admin/referral-program-profiles',
        { method: 'POST', body: JSON.stringify({ name: 'Новый профиль', enabled: true }) },
      );
      await refreshProfiles();
      setSelectedId(row.id);
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : 'Не удалось создать профиль');
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    if (!selected) return;
    const a = Number(String(lvl1).replace(',', '.'));
    const b = Number(String(lvl2).replace(',', '.'));
    const min = Number(String(minRub).replace(/\s+/g, '').replace(',', '.'));
    if (!Number.isFinite(a) || a < 0 || a > 100) {
      setMutationError('Процент L1: число от 0 до 100.');
      return;
    }
    if (!Number.isFinite(b) || b < 0 || b > 100) {
      setMutationError('Процент L2: число от 0 до 100.');
      return;
    }
    if (!Number.isFinite(min) || min < 0) {
      setMutationError('Минимальная сумма: неотрицательное число.');
      return;
    }
    setSaving(true);
    setMutationError(null);
    try {
      await adminBackendJson(`settings/admin/referral-program-profiles/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim() || selected.name,
          level1Percent: a,
          level2Percent: b,
          minimumOrderSiteTotalRub: Math.max(0, Math.round(min)),
        }),
      });
      await refreshProfiles();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  async function makePrimary() {
    if (!selected || selected.isDefault) return;
    setSaving(true);
    setMutationError(null);
    try {
      await adminBackendJson(`settings/admin/referral-program-profiles/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ setAsPrimary: true }),
      });
      await refreshProfiles();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : 'Не удалось назначить основной профиль');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile() {
    if (!selected || selected.isDefault) return;
    if (!(await confirm({ title: `Удалить профиль «${selected.name}»?` }))) return;
    setSaving(true);
    setMutationError(null);
    try {
      await adminBackendJson(`settings/admin/referral-program-profiles/${selected.id}`, {
        method: 'DELETE',
      });
      setSelectedId(null);
      await refreshProfiles();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setSaving(false);
    }
  }

  return (
      <section aria-label="Профили реферальной программы">
      <AdminListShell
        loading={loading}
        error={error}
        onRetry={() => void refetch()}
        loadingLabel="Загрузка…"
        isEmpty={false}
        wrapContent={false}
      >
        <div className={panelStyles.grid}>
          <div className={panelStyles.listPanel}>
            <div className={panelStyles.listHeader}>
              <h2 className={`${catalogStyles.groupHeading} ${panelStyles.panelHeading}`}>Профили</h2>
              <AdminCompactBtn disabled={saving} onClick={() => void createProfile()}>
                Добавить
              </AdminCompactBtn>
            </div>
            <ul className={panelStyles.profileList}>
              {profiles.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`${panelStyles.profileItem} ${
                      p.id === selectedId ? panelStyles.profileItemActive : ''
                    }`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <span className={panelStyles.profileName}>
                      {p.name}
                      {p.isDefault ? (
                        <AdminPillBadge>{ADMIN_PROFILE_PRIMARY_LABEL}</AdminPillBadge>
                      ) : null}
                    </span>
                    <span className={panelStyles.profileMeta}>
                      L1 {p.level1Percent}% · L2 {p.level2Percent}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={panelStyles.listPanel}>
            {selected ? (
              <>
                <h2 className={`${catalogStyles.groupHeading} ${panelStyles.panelHeading}`}>Параметры</h2>
                <div className={panelStyles.profileFormFields}>
                  <AdminTextField
                    label="Название профиля"
                    name="referralProfileName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                  />
                  <AdminTextField
                    label="Процент L1 (прямой реферал)"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    inputMode="decimal"
                    name="level1Percent"
                    value={lvl1}
                    onChange={(e) => setLvl1(e.target.value)}
                    autoComplete="off"
                  />
                  <AdminTextField
                    label="Процент L2 (второй уровень)"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    inputMode="decimal"
                    name="level2Percent"
                    value={lvl2}
                    onChange={(e) => setLvl2(e.target.value)}
                    autoComplete="off"
                  />
                  <AdminTextField
                    label="Минимальная сумма «цена на сайте» по заказу (₽), ниже — бонус 0"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="decimal"
                    name="minimumOrderSiteTotalRub"
                    value={minRub}
                    onChange={(e) => setMinRub(e.target.value)}
                    autoComplete="off"
                  />
                  <div className={catalogStyles.labelCheckboxRow}>
                    <AccountCheckbox
                      id="referral-profile-primary"
                      className={catalogStyles.adminCheckboxForm}
                      checked={selected.isDefault}
                      disabled={selected.isDefault || saving}
                      onChange={() => void makePrimary()}
                    />
                    <label htmlFor="referral-profile-primary">
                      {ADMIN_PROFILE_PRIMARY_LABEL} — для пользователей без группы
                    </label>
                  </div>
                </div>
                <div className={`${catalogStyles.formActions} ${panelStyles.profileFormActions}`}>
                  <AdminCompactBtn
                    variant="accent"
                    disabled={saving}
                    onClick={() => void saveProfile()}
                  >
                    {saving ? 'Сохранение…' : 'Сохранить'}
                  </AdminCompactBtn>
                  {!selected.isDefault ? (
                    <AdminCompactBtn
                      variant="danger"
                      disabled={saving}
                      onClick={() => void deleteProfile()}
                    >
                      Удалить
                    </AdminCompactBtn>
                  ) : null}
                </div>
                {selected.isDefault ? (
                  <p className={catalogStyles.muted} style={{ marginTop: 16, maxWidth: 420 }}>
                    При изменении процентов основного профиля пересчитываются начисления по завершённым
                    заказам.
                  </p>
                ) : null}
              </>
            ) : (
              <p className={catalogStyles.muted}>Выберите профиль слева или создайте новый.</p>
            )}
          </div>
        </div>
      </AdminListShell>
    </section>
  );
}
