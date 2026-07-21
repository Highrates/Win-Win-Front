'use client';

import { useMemo, useState } from 'react';
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
  if (visibleElements.length === 0) return null;

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
                  <li key={a.brandMaterialColorId}>
                    <button
                      type="button"
                      className={`${styles.tile} ${isSelected ? styles.tileSelected : ''}`}
                      aria-pressed={isSelected}
                      aria-label={`${g.materialName}: ${a.colorName}`}
                      onClick={() => onSelect(active.id, a.brandMaterialColorId)}
                    >
                      <span
                        className={styles.tileThumb}
                        style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
                        aria-hidden
                      />
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
    </div>
  );
}
