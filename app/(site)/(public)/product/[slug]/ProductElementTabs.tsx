'use client';

import { useMemo, useState, type FocusEvent } from 'react';
import { createPortal } from 'react-dom';
import type {
  PublicElementAvailabilityApi,
  PublicProductElementApi,
} from '@/lib/publicProductFromApi';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import styles from './ProductElementTabs.module.css';

type Props = {
  elements: PublicProductElementApi[];
  /** Текущий выбор material-color по элементам (elementId → brandMaterialColorId). */
  selections: Record<string, string>;
  onSelect: (elementId: string, brandMaterialColorId: string) => void;
};

type HoverPreview = {
  url: string;
  top: number;
  left: number;
};

type GroupedAvailabilities = {
  materialId: string;
  materialName: string;
  items: PublicElementAvailabilityApi[];
};

function groupByMaterial(items: PublicElementAvailabilityApi[]): GroupedAvailabilities[] {
  const map = new Map<string, GroupedAvailabilities>();
  for (const a of items) {
    const g = map.get(a.brandMaterialId);
    if (g) {
      g.items.push(a);
    } else {
      map.set(a.brandMaterialId, {
        materialId: a.brandMaterialId,
        materialName: a.materialName,
        items: [a],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const sa = a.items[0]?.materialSortOrder ?? 0;
    const sb = b.items[0]?.materialSortOrder ?? 0;
    return sa === sb ? a.materialName.localeCompare(b.materialName) : sa - sb;
  });
}

export default function ProductElementTabs({ elements, selections, onSelect }: Props) {
  const visibleElements = useMemo(
    () => elements.filter((el) => el.availabilities.length > 0),
    [elements],
  );
  const [activeId, setActiveId] = useState<string>(() => visibleElements[0]?.id ?? '');
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  if (visibleElements.length === 0) return null;

  const showHoverPreview = (buttonEl: HTMLButtonElement, url: string) => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (min-width: 769px)').matches) return;
    const thumbEl = buttonEl.querySelector(`.${styles.tileThumbWrap}`) as HTMLElement | null;
    const rect = (thumbEl ?? buttonEl).getBoundingClientRect();
    setHoverPreview({
      url,
      top: rect.top + rect.height / 2,
      left: rect.left + rect.width / 2,
    });
  };

  const active = visibleElements.find((el) => el.id === activeId) ?? visibleElements[0]!;
  const groups = groupByMaterial(active.availabilities);
  const activeSelectedBmcId = selections[active.id] ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.tabs} role="tablist" aria-label="Элементы товара">
        {visibleElements.map((el) => {
          const selected = el.id === active.id;
          return (
            <button
              key={el.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`${styles.tab} ${selected ? styles.tabActive : ''}`}
              onClick={() => setActiveId(el.id)}
            >
              {el.name}
            </button>
          );
        })}
      </div>

      <div className={styles.tabPanel} role="tabpanel">
        {groups.map((g) => (
          <section key={g.materialId} className={styles.materialGroup}>
            <h4 className={styles.materialTitle}>{g.materialName}</h4>
            <ul className={styles.tileGrid}>
              {g.items.map((a) => {
                const imageUrl = resolveMediaUrlForClient(a.imageUrl);
                const isSelected = activeSelectedBmcId === a.brandMaterialColorId;
                return (
                  <li key={a.brandMaterialColorId} className={styles.tileItem}>
                    <button
                      type="button"
                      className={`${styles.tile} ${isSelected ? styles.tileSelected : ''}`}
                      aria-pressed={isSelected}
                      aria-label={`${g.materialName}: ${a.colorName}`}
                      onClick={() => onSelect(active.id, a.brandMaterialColorId)}
                      onMouseEnter={imageUrl ? (e) => showHoverPreview(e.currentTarget, imageUrl) : undefined}
                      onMouseLeave={() => setHoverPreview(null)}
                      onFocus={imageUrl ? (e: FocusEvent<HTMLButtonElement>) => showHoverPreview(e.currentTarget, imageUrl) : undefined}
                      onBlur={() => setHoverPreview(null)}
                    >
                      <span className={styles.tileThumbWrap}>
                        <span
                          className={styles.tileThumb}
                          style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
                          aria-hidden
                        />
                      </span>
                      <span className={styles.tileMeta}>
                        <span className={styles.tileName}>{a.colorName}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {hoverPreview && typeof document !== 'undefined'
        ? createPortal(
            <div
              className={styles.hoverPreviewPortal}
              style={{
                top: hoverPreview.top,
                left: hoverPreview.left,
                backgroundImage: `url("${hoverPreview.url}")`,
              }}
              aria-hidden
            />,
            document.body,
          )
        : null}
    </div>
  );
}
