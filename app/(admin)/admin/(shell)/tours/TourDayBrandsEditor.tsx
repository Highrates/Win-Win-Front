'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTableRemoveButton } from '@/components/admin/AdminTableRemoveButton/AdminTableRemoveButton';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendList, adminListParams } from '@/lib/adminListResponse';
import { emptyDayBrand, type EditorDayBrand } from './tourEditorHelpers';
import styles from './toursAdmin.module.css';

type BrandHit = { id: string; name: string; slug: string };

type Props = {
  brands: EditorDayBrand[];
  onChange: (next: EditorDayBrand[]) => void;
};

export function TourDayBrandsEditor({ brands, onChange }: Props) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [hits, setHits] = useState<BrandHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminBackendList<BrandHit>(
      'catalog/admin/brands',
      adminListParams({ page: 1, limit: 30, q: debouncedQ }),
    )
      .then((res) => {
        if (!cancelled) setHits(res.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  const attachedIds = useMemo(
    () => new Set(brands.map((b) => b.brandId).filter(Boolean) as string[]),
    [brands],
  );

  const availableHits = hits.filter((h) => !attachedIds.has(h.id));

  function addCatalogBrand(hit: BrandHit) {
    if (attachedIds.has(hit.id)) return;
    onChange([
      ...brands,
      emptyDayBrand({
        brandId: hit.id,
        name: hit.name,
        slug: hit.slug,
        customName: null,
      }),
    ]);
    setQ('');
  }

  function addCustom() {
    const name = customName.trim();
    if (!name) return;
    onChange([
      ...brands,
      emptyDayBrand({
        brandId: null,
        customName: name,
        name,
        slug: null,
      }),
    ]);
    setCustomName('');
  }

  function removeAt(index: number) {
    onChange(brands.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.dayBrands}>
      <p className={styles.dayBrandsLabel}>Фабрики / бренды дня</p>

      {brands.length > 0 ? (
        <ul className={styles.dayBrandChips}>
          {brands.map((b, i) => (
            <li key={b.clientKey} className={styles.dayBrandChip}>
              <span className={styles.dayBrandChipName}>
                {b.name || b.customName || 'Без названия'}
                {!b.brandId ? (
                  <span className={styles.dayBrandChipHint}>своё</span>
                ) : null}
              </span>
              <AdminTableRemoveButton label="Убрать бренд" onClick={() => removeAt(i)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.dayBrandsEmpty}>Пока не добавлено</p>
      )}

      <div className={styles.dayBrandsAdd}>
        <AdminTextField
          label="Найти бренд в каталоге"
          value={q}
          placeholder="Начните вводить название…"
          onChange={(e) => setQ(e.target.value)}
        />
        {q.trim() ? (
          <div className={styles.dayBrandHits} role="listbox" aria-label="Результаты поиска брендов">
            {loading ? <p className={styles.dayBrandsEmpty}>Поиск…</p> : null}
            {!loading && availableHits.length === 0 ? (
              <p className={styles.dayBrandsEmpty}>Ничего не найдено</p>
            ) : null}
            {availableHits.map((h) => (
              <button
                key={h.id}
                type="button"
                className={styles.dayBrandHit}
                onClick={() => addCatalogBrand(h)}
              >
                {h.name}
                <span className={styles.dayBrandChipHint}>{h.slug}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.dayBrandsCustomRow}>
          <AdminTextField
            label="Или своё название"
            value={customName}
            placeholder="Например: фабрика без карточки"
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <AdminCompactBtn type="button" onClick={addCustom} disabled={!customName.trim()}>
            Добавить
          </AdminCompactBtn>
        </div>
      </div>
    </div>
  );
}
