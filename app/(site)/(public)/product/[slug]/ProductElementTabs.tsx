'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  PublicElementAvailabilityApi,
  PublicProductElementApi,
} from '@/lib/publicProductFromApi';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import productSelectChrome from './ProductSelectChrome.module.css';
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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M5 5L15 15M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [lightbox]);

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
                const label = `${g.materialName}: ${a.colorName}`;
                return (
                  <li key={a.brandMaterialColorId} className={styles.tileItem}>
                    <div className={styles.tileShell}>
                      <button
                        type="button"
                        className={`${styles.tile}${isSelected ? ` ${styles.tileSelected} ${productSelectChrome.selectedBorder}` : ''}`}
                        aria-pressed={isSelected}
                        aria-label={label}
                        onClick={() => onSelect(active.id, a.brandMaterialColorId)}
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
                      {imageUrl ? (
                        <button
                          type="button"
                          className={styles.zoomBtn}
                          aria-label={`Увеличить: ${label}`}
                          onClick={() => setLightbox({ url: imageUrl, label })}
                        >
                          <img src="/icons/zoom-in.svg" alt="" width={16} height={16} aria-hidden />
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {lightbox && typeof document !== 'undefined'
        ? createPortal(
            <div
              className={styles.lightbox}
              role="dialog"
              aria-modal="true"
              aria-label={lightbox.label}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setLightbox(null);
              }}
            >
              <button
                type="button"
                className={styles.lightboxClose}
                aria-label="Закрыть"
                onClick={() => setLightbox(null)}
              >
                <CloseIcon />
              </button>
              <img className={styles.lightboxImg} src={lightbox.url} alt={lightbox.label} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
