'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import type {
  AdminBrandMaterial,
  AdminBrandMaterialColor,
} from '@/app/(admin)/admin/brands/adminBrandTypes';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import styles from './BrandMaterialColorPickerModal.module.css';

export type BrandMaterialColorPick = {
  brandMaterialColorId: string;
  materialName: string;
  colorName: string;
  imageUrl: string | null;
};

type Props = {
  open: boolean;
  brandId: string | null;
  /** Что уже выбрано (id набора). */
  preSelectedIds: string[];
  title?: string;
  onClose: () => void;
  /** Подтверждение выбора — массив «материал-цветов», в порядке клика/из библиотеки. */
  onConfirm: (picked: BrandMaterialColorPick[]) => void;
};

export function BrandMaterialColorPickerModal({
  open,
  brandId,
  preSelectedIds,
  title,
  onClose,
  onConfirm,
}: Props) {
  const [materials, setMaterials] = useState<AdminBrandMaterial[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(preSelectedIds));
  }, [open, preSelectedIds]);

  useEffect(() => {
    if (!open || !brandId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const rows = await adminBackendJson<AdminBrandMaterial[]>(
          `catalog/admin/brands/${brandId}/materials`,
        );
        if (cancelled) return;
        setMaterials(rows);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить материалы бренда');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, brandId]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allColors = useMemo(() => {
    if (!materials) return new Map<string, { material: AdminBrandMaterial; color: AdminBrandMaterialColor }>();
    const map = new Map<string, { material: AdminBrandMaterial; color: AdminBrandMaterialColor }>();
    for (const m of materials) {
      for (const c of m.colors) {
        map.set(c.id, { material: m, color: c });
      }
    }
    return map;
  }, [materials]);

  function confirm() {
    const out: BrandMaterialColorPick[] = [];
    if (materials) {
      for (const m of materials) {
        for (const c of m.colors) {
          if (selected.has(c.id)) {
            out.push({
              brandMaterialColorId: c.id,
              materialName: m.name,
              colorName: c.name,
              imageUrl: c.imageUrl,
            });
          }
        }
      }
    }
    onConfirm(out);
  }

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.shell} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title ?? 'Выберите «материал-цвет»'}</h2>
          <button
            type="button"
            className={catalogStyles.modalCloseIconBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className={styles.body}>
          {!brandId ? (
            <p className={styles.empty}>
              У товара не выбран бренд. Выберите бренд в карточке товара, чтобы использовать его
              библиотеку «материал-цветов».
            </p>
          ) : loading ? (
            <p className={styles.empty}>Загрузка библиотеки бренда…</p>
          ) : loadError ? (
            <p className={catalogStyles.error}>{loadError}</p>
          ) : !materials || materials.length === 0 ? (
            <p className={styles.empty}>
              В бренде ещё не заведены материалы и цвета — добавьте их на странице бренда.
            </p>
          ) : (
            materials.map((m) => {
              if (m.colors.length === 0) return null;
              return (
                <div key={m.id} className={styles.materialGroup}>
                  <h3 className={styles.materialTitle}>{m.name}</h3>
                  <div className={styles.colorsGrid}>
                    {m.colors.map((c) => {
                      const isSelected = selected.has(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`${styles.colorTile} ${isSelected ? styles.colorTileSelected : ''}`}
                          onClick={() => toggle(c.id)}
                          aria-pressed={isSelected}
                        >
                          {isSelected ? <span className={styles.selectedBadge} aria-hidden>✓</span> : null}
                          {c.imageUrl ? (
                            <img
                              className={styles.colorTileThumb}
                              src={c.imageUrl}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <div className={styles.colorTileThumbPh} aria-hidden />
                          )}
                          <div className={styles.colorTileLabel}>
                            <span className={styles.colorTileName}>{c.name}</span>
                            <span className={styles.colorTileSub}>{m.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className={styles.footer}>
          <span className={styles.footerCounter}>
            Выбрано: {selected.size}
            {materials ? ` из ${allColors.size}` : ''}
          </span>
          <div className={styles.footerActions}>
            <button type="button" className={catalogStyles.btn} onClick={onClose}>
              Отмена
            </button>
            <button
              type="button"
              className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}
              onClick={confirm}
              disabled={!materials}
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
