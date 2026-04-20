'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminCategoryRow } from '../../catalog/categories/adminCategoryTypes';
import type { PricingProfileRow } from '../pricingAdminTypes';
import { adminBackendFetch, adminBackendJson } from '@/lib/adminBackendFetch';
import { adminPricingStrings } from '@/lib/admin-i18n/adminPricingI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import pn from '../../catalog/products/new/productNew.module.css';
import styles from './pricingSettings.module.css';

const ALL_CATEGORIES_VALUE = '__ALL__';

type FormState = {
  name: string;
  containerType: '40' | '20';
  containerMaxWeightKg: string;
  containerMaxVolumeM3: string;
  cnyRate: string;
  usdRate: string;
  eurRate: string;
  transferCommissionPct: string;
  customsAdValoremPct: string;
  customsWeightPct: string;
  vatPct: string;
  markupPct: string;
  agentRub: string;
  warehousePortUsd: string;
  fobUsd: string;
  portMskRub: string;
  extraLogisticsRub: string;
  categoryIds: Set<string>;
};

function emptyForm(): FormState {
  return {
    name: '',
    containerType: '40',
    containerMaxWeightKg: '',
    containerMaxVolumeM3: '',
    cnyRate: '11.5',
    usdRate: '79',
    eurRate: '91',
    transferCommissionPct: '4',
    customsAdValoremPct: '10',
    customsWeightPct: '8',
    vatPct: '22',
    markupPct: '0',
    agentRub: '50000',
    warehousePortUsd: '950',
    fobUsd: '4000',
    portMskRub: '280000',
    extraLogisticsRub: '141000',
    categoryIds: new Set(),
  };
}

function profileToForm(p: PricingProfileRow): FormState {
  return {
    name: p.name,
    containerType: p.containerType === '20' ? '20' : '40',
    containerMaxWeightKg: p.containerMaxWeightKg != null ? String(p.containerMaxWeightKg) : '',
    containerMaxVolumeM3: p.containerMaxVolumeM3 != null ? String(p.containerMaxVolumeM3) : '',
    cnyRate: p.cnyRate,
    usdRate: p.usdRate,
    eurRate: p.eurRate,
    transferCommissionPct: p.transferCommissionPct,
    customsAdValoremPct: p.customsAdValoremPct,
    customsWeightPct: p.customsWeightPct,
    vatPct: p.vatPct,
    markupPct: p.markupPct,
    agentRub: p.agentRub,
    warehousePortUsd: p.warehousePortUsd,
    fobUsd: p.fobUsd,
    portMskRub: p.portMskRub,
    extraLogisticsRub: p.extraLogisticsRub,
    categoryIds: new Set(p.categoryIds),
  };
}

function parseNum(s: string): number {
  const n = Number(String(s).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

/** Max вес (кг) и объём (м³) до 90% — соответствуют стандартам 40'/20' в расчёте. */
function defaultContainerMaxLimits(containerType: '40' | '20'): { kg: string; m3: string } {
  if (containerType === '20') return { kg: '28230', m3: '33' };
  return { kg: '26700', m3: '67' };
}

export function PricingSettingsClient() {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminPricingStrings(locale), [locale]);
  const sortLocale = locale === 'zh' ? 'zh' : 'ru';

  const [profiles, setProfiles] = useState<PricingProfileRow[]>([]);
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflictCategoryIds, setConflictCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [catSelectKey, setCatSelectKey] = useState(0);
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [modalWeight, setModalWeight] = useState('');
  const [modalVolume, setModalVolume] = useState('');

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [profs, cats] = await Promise.all([
        adminBackendJson<PricingProfileRow[]>('catalog/admin/pricing-profiles'),
        adminBackendJson<AdminCategoryRow[]>('catalog/admin/categories'),
      ]);
      setProfiles(profs);
      setCategories(cats);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : s.errLoad);
    }
  }, [s]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const la = a.parent ? `${a.parent.name} ${a.name}` : a.name;
      const lb = b.parent ? `${b.parent.name} ${b.name}` : b.name;
      return la.localeCompare(lb, sortLocale);
    });
  }, [categories, sortLocale]);

  function categoryLabel(c: AdminCategoryRow): string {
    return c.parent ? `${c.parent.name} → ${c.name}` : c.name;
  }

  const categoriesAvailableToAdd = useMemo(() => {
    const chosen = form.categoryIds;
    const allIds = new Set(sortedCategories.map((c) => c.id));
    const hasAll = sortedCategories.length > 0 && sortedCategories.every((c) => chosen.has(c.id));
    if (hasAll) return [];
    return sortedCategories.filter((c) => !chosen.has(c.id));
  }, [sortedCategories, form.categoryIds]);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm());
    setSaveError(null);
    setConflictCategoryIds([]);
    setCatSelectKey((k) => k + 1);
  }

  function startEdit(p: PricingProfileRow) {
    setEditingId(p.id);
    setForm(profileToForm(p));
    setSaveError(null);
    setConflictCategoryIds([]);
    setCatSelectKey((k) => k + 1);
  }

  function addCategoryFromDropdown(raw: string) {
    if (!raw) return;
    if (raw === ALL_CATEGORIES_VALUE) {
      setForm((prev) => ({
        ...prev,
        categoryIds: new Set(sortedCategories.map((c) => c.id)),
      }));
    } else {
      setForm((prev) => {
        const next = new Set(prev.categoryIds);
        next.add(raw);
        return { ...prev, categoryIds: next };
      });
    }
    setCatSelectKey((k) => k + 1);
  }

  function removeCategoryChip(id: string) {
    setForm((prev) => {
      const next = new Set(prev.categoryIds);
      next.delete(id);
      return { ...prev, categoryIds: next };
    });
  }

  function openContainerModal() {
    const w = form.containerMaxWeightKg.trim();
    const v = form.containerMaxVolumeM3.trim();
    if (w && v) {
      setModalWeight(w);
      setModalVolume(v);
    } else {
      const d = defaultContainerMaxLimits(form.containerType);
      setModalWeight(d.kg);
      setModalVolume(d.m3);
    }
    setContainerModalOpen(true);
  }

  function applyContainerModal() {
    const std = defaultContainerMaxLimits(form.containerType);
    const mw = modalWeight.trim();
    const mv = modalVolume.trim();
    const nw = parseNum(mw);
    const nv = parseNum(mv);
    const sw = parseNum(std.kg);
    const sv = parseNum(std.m3);
    if (mw === '' && mv === '') {
      setForm((f) => ({ ...f, containerMaxWeightKg: '', containerMaxVolumeM3: '' }));
    } else if (Number.isFinite(nw) && Number.isFinite(nv) && nw === sw && nv === sv) {
      setForm((f) => ({ ...f, containerMaxWeightKg: '', containerMaxVolumeM3: '' }));
    } else {
      setForm((f) => ({
        ...f,
        containerMaxWeightKg: mw,
        containerMaxVolumeM3: mv,
      }));
    }
    setContainerModalOpen(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setConflictCategoryIds([]);
    const categoryIds = Array.from(form.categoryIds);
    if (!categoryIds.length) {
      setSaveError(s.pickCategory);
      return;
    }

    const wt = form.containerMaxWeightKg.trim();
    const vol = form.containerMaxVolumeM3.trim();
    let containerMaxWeightKg: number | null = null;
    let containerMaxVolumeM3: number | null = null;
    if (wt || vol) {
      const nw = parseNum(wt);
      const nv = parseNum(vol);
      if (!Number.isFinite(nw) || nw <= 0 || !Number.isFinite(nv) || nv <= 0) {
        setSaveError(s.containerRule);
        return;
      }
      containerMaxWeightKg = nw;
      containerMaxVolumeM3 = nv;
    }

    const nums = {
      cnyRate: parseNum(form.cnyRate),
      usdRate: parseNum(form.usdRate),
      eurRate: parseNum(form.eurRate),
      transferCommissionPct: parseNum(form.transferCommissionPct),
      customsAdValoremPct: parseNum(form.customsAdValoremPct),
      customsWeightPct: parseNum(form.customsWeightPct),
      vatPct: parseNum(form.vatPct),
      markupPct: parseNum(form.markupPct),
      agentRub: parseNum(form.agentRub),
      warehousePortUsd: parseNum(form.warehousePortUsd),
      fobUsd: parseNum(form.fobUsd),
      portMskRub: parseNum(form.portMskRub),
      extraLogisticsRub: parseNum(form.extraLogisticsRub),
    };
    for (const [k, v] of Object.entries(nums)) {
      if (!Number.isFinite(v) || v < 0) {
        setSaveError(s.badNumber(k));
        return;
      }
    }

    const body = {
      name: form.name.trim(),
      containerType: form.containerType,
      containerMaxWeightKg,
      containerMaxVolumeM3,
      cnyRate: nums.cnyRate,
      usdRate: nums.usdRate,
      eurRate: nums.eurRate,
      transferCommissionPct: nums.transferCommissionPct,
      customsAdValoremPct: nums.customsAdValoremPct,
      customsWeightPct: nums.customsWeightPct,
      vatPct: nums.vatPct,
      markupPct: nums.markupPct,
      agentRub: nums.agentRub,
      warehousePortUsd: nums.warehousePortUsd,
      fobUsd: nums.fobUsd,
      portMskRub: nums.portMskRub,
      extraLogisticsRub: nums.extraLogisticsRub,
      categoryIds,
    };

    setSaving(true);
    try {
      const path =
        editingId != null
          ? `catalog/admin/pricing-profiles/${editingId}`
          : 'catalog/admin/pricing-profiles';
      const res = await adminBackendFetch(path, {
        method: editingId != null ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as {
        message?: string;
        conflictingCategoryIds?: string[];
      };
      if (!res.ok) {
        if (Array.isArray(j.conflictingCategoryIds) && j.conflictingCategoryIds.length) {
          setConflictCategoryIds(j.conflictingCategoryIds);
        }
        setSaveError(typeof j.message === 'string' ? j.message : s.saveErr);
        return;
      }
      await load();
      startNew();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : s.saveErr);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(s.confirmDeleteProfile)) return;
    setSaveError(null);
    try {
      await adminBackendJson(`catalog/admin/pricing-profiles/${id}`, { method: 'DELETE' });
      if (editingId === id) startNew();
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : s.deleteErr);
    }
  }

  const hasCustomContainer =
    form.containerMaxWeightKg.trim() !== '' || form.containerMaxVolumeM3.trim() !== '';

  return (
    <div className={styles.layout}>
      {loadError ? <p className={catalogStyles.error}>{loadError}</p> : null}

      {containerModalOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => setContainerModalOpen(false)}
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-labelledby="container-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="container-modal-title" className={styles.modalTitle}>
              {s.containerParams}
            </h3>
            <label className={catalogStyles.label}>
              {s.maxWeight}
              <input
                className={catalogStyles.input}
                inputMode="decimal"
                value={modalWeight}
                onChange={(e) => setModalWeight(e.target.value)}
              />
            </label>
            <label className={catalogStyles.label}>
              {s.maxVol}
              <input
                className={catalogStyles.input}
                inputMode="decimal"
                value={modalVolume}
                onChange={(e) => setModalVolume(e.target.value)}
              />
            </label>
            <div className={styles.modalActions}>
              <button type="button" className={catalogStyles.btn} onClick={applyContainerModal}>
                {s.save}
              </button>
              <button
                type="button"
                className={catalogStyles.btn}
                onClick={() => {
                  setModalWeight('');
                  setModalVolume('');
                }}
              >
                {s.clearFields}
              </button>
              <button
                type="button"
                className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
                onClick={() => setContainerModalOpen(false)}
              >
                {s.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.grid}>
        <section className={styles.listPanel}>
          <div className={styles.listHeader}>
            <h2 className={styles.h2}>{s.profiles}</h2>
            <button type="button" className={catalogStyles.btn} onClick={startNew}>
              {s.newProfile}
            </button>
          </div>
          <ul className={styles.profileList}>
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`${styles.profileItem} ${editingId === p.id ? styles.profileItemActive : ''}`}
                  onClick={() => startEdit(p)}
                >
                  <span className={styles.profileName}>{p.name.trim() || s.unnamed}</span>
                  <span className={styles.profileMeta}>
                    {s.containerBit(p.containerType, p.categoryIds.length)}
                  </span>
                </button>
                <button
                  type="button"
                  className={`${catalogStyles.btn} ${catalogStyles.btnDanger} ${styles.btnDelete}`}
                  onClick={() => remove(p.id)}
                >
                  {s.delete}
                </button>
              </li>
            ))}
          </ul>
          {profiles.length === 0 ? <p className={catalogStyles.muted}>{s.noProfiles}</p> : null}
        </section>

        <section className={styles.formPanel}>
          <h2 className={styles.h2}>{editingId ? s.editTitle : s.newTitle}</h2>
          {saveError ? <p className={catalogStyles.error}>{saveError}</p> : null}

          <form className={styles.form} onSubmit={save}>
            <label className={catalogStyles.label}>
              {s.nameAdmin}
              <input
                className={catalogStyles.input}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={s.namePh}
              />
            </label>

            <fieldset className={styles.fieldset}>
              <legend>{s.legendCats}</legend>
              <div className={pn.additionalCatsWrap}>
                <label className={catalogStyles.label}>
                  {s.addCat}
                  <select
                    key={catSelectKey}
                    className={catalogStyles.input}
                    defaultValue=""
                    aria-label={s.addCatAria}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) addCategoryFromDropdown(v);
                    }}
                  >
                    <option value="">{s.choose}</option>
                    {sortedCategories.length > 0 ? (
                      <option value={ALL_CATEGORIES_VALUE}>{s.allCats}</option>
                    ) : null}
                    {categoriesAvailableToAdd.map((c) => (
                      <option key={c.id} value={c.id}>
                        {categoryLabel(c)}
                      </option>
                    ))}
                  </select>
                </label>
                {form.categoryIds.size > 0 ? (
                  <ul className={pn.additionalCatChips} aria-label={s.selectedCatsAria}>
                    {Array.from(form.categoryIds).map((id) => {
                      const c = categories.find((x) => x.id === id);
                      if (!c) return null;
                      const label = categoryLabel(c);
                      const conflict = conflictCategoryIds.includes(id);
                      return (
                        <li
                          key={id}
                          className={`${pn.additionalCatChip} ${conflict ? styles.chipConflict : ''}`}
                        >
                          <span className={pn.additionalCatChipLabel}>{label}</span>
                          <button
                            type="button"
                            className={pn.additionalCatChipRemove}
                            onClick={() => removeCategoryChip(id)}
                            aria-label={s.removeAria(label)}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={catalogStyles.muted} style={{ marginTop: 8 }}>
                    {s.noCatsSelected}
                  </p>
                )}
              </div>
            </fieldset>

            <div className={styles.containerTypeRow}>
              <label className={catalogStyles.label} style={{ flex: 1, marginBottom: 0 }}>
                {s.containerType}
                <select
                  className={catalogStyles.input}
                  value={form.containerType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, containerType: e.target.value === '20' ? '20' : '40' }))
                  }
                >
                  <option value="40">40&apos; Standard</option>
                  <option value="20">20&apos; Standard</option>
                </select>
              </label>
              <button type="button" className={styles.containerParamsLink} onClick={openContainerModal}>
                {s.changeContainer}
              </button>
            </div>
            {hasCustomContainer ? (
              <p className={catalogStyles.muted} style={{ marginTop: 0 }}>
                {s.customLimits(
                  form.containerMaxWeightKg.trim() || '—',
                  form.containerMaxVolumeM3.trim() || '—',
                )}
              </p>
            ) : null}

            <fieldset className={styles.fieldset}>
              <legend>{s.legendRates}</legend>
              <div className={styles.row3}>
                <label className={catalogStyles.label}>
                  {s.rateCny}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.cnyRate}
                    onChange={(e) => setForm((f) => ({ ...f, cnyRate: e.target.value }))}
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.rateUsd}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.usdRate}
                    onChange={(e) => setForm((f) => ({ ...f, usdRate: e.target.value }))}
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.rateEur}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.eurRate}
                    onChange={(e) => setForm((f) => ({ ...f, eurRate: e.target.value }))}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend>{s.legendLogistics}</legend>
              <div className={styles.row2}>
                <label className={catalogStyles.label}>
                  {s.legChinaUsd}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.warehousePortUsd}
                    onChange={(e) => setForm((f) => ({ ...f, warehousePortUsd: e.target.value }))}
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.legFobUsd}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.fobUsd}
                    onChange={(e) => setForm((f) => ({ ...f, fobUsd: e.target.value }))}
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.legPortMsk}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.portMskRub}
                    onChange={(e) => setForm((f) => ({ ...f, portMskRub: e.target.value }))}
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.legOtherRub}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.extraLogisticsRub}
                    onChange={(e) => setForm((f) => ({ ...f, extraLogisticsRub: e.target.value }))}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend>{s.legendPercents}</legend>
              <div className={styles.row2}>
                <label className={catalogStyles.label}>
                  {s.feeTransfer}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.transferCommissionPct}
                    onChange={(e) => setForm((f) => ({ ...f, transferCommissionPct: e.target.value }))}
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.dutyAdval}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.customsAdValoremPct}
                    onChange={(e) => setForm((f) => ({ ...f, customsAdValoremPct: e.target.value }))}
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.dutyWeight}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.customsWeightPct}
                    onChange={(e) => setForm((f) => ({ ...f, customsWeightPct: e.target.value }))}
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.vat}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.vatPct}
                    onChange={(e) => setForm((f) => ({ ...f, vatPct: e.target.value }))}
                  />
                </label>
                <label className={catalogStyles.label}>
                  {s.agency}
                  <input
                    className={catalogStyles.input}
                    inputMode="decimal"
                    value={form.agentRub}
                    onChange={(e) => setForm((f) => ({ ...f, agentRub: e.target.value }))}
                  />
                </label>
              </div>
            </fieldset>

            <div className={styles.markupBlock}>
              <label className={catalogStyles.label}>
                {s.markup}
                <input
                  className={catalogStyles.input}
                  inputMode="decimal"
                  value={form.markupPct}
                  onChange={(e) => setForm((f) => ({ ...f, markupPct: e.target.value }))}
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={catalogStyles.btn} disabled={saving}>
                {saving ? s.saving : s.saveProfile}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
