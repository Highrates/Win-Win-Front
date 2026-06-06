'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminPillBadge } from '@/components/AdminPillChip/AdminPillChip';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendFetch, adminBackendJson } from '@/lib/adminBackendFetch';
import { ADMIN_PROFILE_PRIMARY_LABEL } from '@/lib/adminProfilePrimary';
import type { DesignerBonusProfileRow } from '@/lib/adminUserGroupProfilesTypes';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import panelStyles from '../../pricing/pricingSettings.module.css';

export function DesignerBonusProfilesPanel() {
  const [profiles, setProfiles] = useState<DesignerBonusProfileRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pct, setPct] = useState('');
  const [minRub, setMinRub] = useState('');
  const [kpMaxDisc, setKpMaxDisc] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm } = useAdminConfirm();

  const selected = profiles.find((p) => p.id === selectedId) ?? null;

  const loadProfiles = useCallback(async () => {
    const rows = await adminBackendJson<DesignerBonusProfileRow[]>(
      'settings/admin/designer-bonus-profiles',
    );
    setProfiles(rows);
    setSelectedId((cur) => {
      if (cur && rows.some((r) => r.id === cur)) return cur;
      return rows.find((r) => r.isDefault)?.id ?? rows[0]?.id ?? null;
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadProfiles();
      const res = await adminBackendFetch('settings/admin/orders', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { kpMaxLineDiscountPercent?: number };
        setKpMaxDisc(String(data.kpMaxLineDiscountPercent ?? 100));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить настройки');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [loadProfiles]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setName('');
      setPct('');
      setMinRub('');
      return;
    }
    setName(selected.name);
    setPct(String(selected.designerOwnCatalogBonusPercent));
    setMinRub(String(selected.designerOwnMinimumCatalogSiteTotalRub));
  }, [selected]);

  async function createProfile() {
    setSaving(true);
    setError(null);
    try {
      const row = await adminBackendJson<DesignerBonusProfileRow>(
        'settings/admin/designer-bonus-profiles',
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Новый профиль',
            designerOwnCatalogBonusPercent: 0,
            designerOwnMinimumCatalogSiteTotalRub: 0,
          }),
        },
      );
      await load();
      setSelectedId(row.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать профиль');
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    if (!selected) return;
    const bonusPct = Number(String(pct).replace(',', '.'));
    const bonusMin = Number(String(minRub).replace(/\s+/g, '').replace(',', '.'));
    if (!Number.isFinite(bonusPct) || bonusPct < 0 || bonusPct > 100) {
      setError('Процент: число от 0 до 100.');
      return;
    }
    if (!Number.isFinite(bonusMin) || bonusMin < 0) {
      setError('Порог каталога: неотрицательное число.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminBackendJson(`settings/admin/designer-bonus-profiles/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim() || selected.name,
          designerOwnCatalogBonusPercent: bonusPct,
          designerOwnMinimumCatalogSiteTotalRub: bonusMin,
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  async function makePrimary() {
    if (!selected || selected.isDefault) return;
    setSaving(true);
    setError(null);
    try {
      await adminBackendJson(`settings/admin/designer-bonus-profiles/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ setAsPrimary: true }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось назначить основной профиль');
    } finally {
      setSaving(false);
    }
  }

  async function saveKpLimit() {
    const kp = Number(String(kpMaxDisc).replace(',', '.'));
    if (!Number.isFinite(kp) || kp < 0 || kp > 100) {
      setError('Лимит скидки КП: число от 0 до 100.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await adminBackendFetch('settings/admin/orders', {
        method: 'PATCH',
        body: JSON.stringify({ kpMaxLineDiscountPercent: kp }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(typeof j.message === 'string' ? j.message : 'Не удалось сохранить');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить лимит КП');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile() {
    if (!selected || selected.isDefault) return;
    if (!(await confirm({ title: `Удалить профиль «${selected.name}»?` }))) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminBackendFetch(`settings/admin/designer-bonus-profiles/${selected.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(typeof j.message === 'string' ? j.message : 'Не удалось удалить');
      }
      setSelectedId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setSaving(false);
    }
  }

  return (
      <section aria-label="Бонусы дизайнера">
      <p className={catalogStyles.muted}>
        Профиль с меткой «{ADMIN_PROFILE_PRIMARY_LABEL}» задаёт бонус со своего заказа для пользователей
        без группы.
      </p>
      {error ? <p className={catalogStyles.error}>{error}</p> : null}
      {loading ? <p className={catalogStyles.muted}>Загрузка…</p> : null}

      <div className={panelStyles.grid} style={{ marginTop: 12 }}>
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
                    {p.designerOwnCatalogBonusPercent}% · от {p.designerOwnMinimumCatalogSiteTotalRub} ₽
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
                  name="designerBonusProfileName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
                <AdminTextField
                  label="Бонус дизайнера со своего заказа, %"
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  inputMode="decimal"
                  name="designerOwnCatalogBonusPercent"
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                  autoComplete="off"
                />
                <AdminTextField
                  label="Мин. сумма заказа для бонуса, ₽"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="decimal"
                  name="designerOwnMinimumCatalogSiteTotalRub"
                  value={minRub}
                  onChange={(e) => setMinRub(e.target.value)}
                  autoComplete="off"
                />
                <div className={catalogStyles.labelCheckboxRow}>
                  <AccountCheckbox
                    id="designer-bonus-profile-primary"
                    className={catalogStyles.adminCheckboxForm}
                    checked={selected.isDefault}
                    disabled={selected.isDefault || saving}
                    onChange={() => void makePrimary()}
                  />
                  <label htmlFor="designer-bonus-profile-primary">
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
            </>
          ) : (
            <p className={catalogStyles.muted}>Выберите профиль слева или создайте новый.</p>
          )}
        </div>
      </div>

      <hr className={panelStyles.profileSectionDivider} />

      <h2 className={`${catalogStyles.groupHeading} ${panelStyles.sectionHeading}`}>
        Глобально для всех заказов
      </h2>
      <div className={panelStyles.profileFormFields} style={{ marginTop: 8 }}>
        <AdminTextField
          label="Макс. скидка по строке коммерческого предложения, %"
          type="number"
          min={0}
          max={100}
          step={1}
          inputMode="decimal"
          name="kpMaxLineDiscountPercent"
          value={kpMaxDisc}
          onChange={(e) => setKpMaxDisc(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className={`${catalogStyles.formActions} ${panelStyles.profileFormActions}`}>
        <AdminCompactBtn
          variant="accent"
          disabled={saving || loading}
          onClick={() => void saveKpLimit()}
        >
          {saving ? 'Сохранение…' : 'Сохранить лимит КП'}
        </AdminCompactBtn>
      </div>
    </section>
  );
}
