'use client';

import Link from 'next/link';
import styles from './ProjectsPage.module.css';

type Props = {
  /** Первый элемент — «Все пространства», далее уникальные помещения из опубликованных кейсов */
  roomChips: string[];
  activeLabel: string;
  onActiveChange: (label: string) => void;
  /** Фильтр по товару из query `?product=` — тег над чипами помещений */
  productFilter?: { id: string; label: string } | null;
};

function RoomChipRow({
  roomChips,
  activeLabel,
  onActiveChange,
}: {
  roomChips: string[];
  activeLabel: string;
  onActiveChange: (label: string) => void;
}) {
  return (
    <div className={styles.marketRoomGroupWrap}>
      <div className={styles.marketRoomGroup} role="listbox" aria-label="Фильтр по помещению">
        {roomChips.map((label) => (
          <button
            key={label}
            type="button"
            role="option"
            aria-selected={label === activeLabel}
            className={label === activeLabel ? styles.marketRoomBtnActive : styles.marketRoomBtn}
            onClick={() => onActiveChange(label)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProjectsRoomFilter({
  roomChips,
  activeLabel,
  onActiveChange,
  productFilter,
}: Props) {
  return (
    <div className={styles.marketRoomToolbar}>
      {productFilter ? (
        <div className={styles.marketProductFilterRow}>
          <div className={styles.marketProductFilterChip}>
            <span className={styles.marketProductFilterLabel} title={productFilter.label}>
              {productFilter.label}
            </span>
            <Link
              href="/projects"
              className={styles.marketProductFilterClear}
              aria-label="Сбросить фильтр по товару"
              prefetch={false}
            >
              ×
            </Link>
          </div>
        </div>
      ) : null}

      <div className={styles.marketSectionRowLeft}>
        <div className={styles.marketRoomGroupDesktop}>
          <RoomChipRow roomChips={roomChips} activeLabel={activeLabel} onActiveChange={onActiveChange} />
        </div>

        <div className={styles.marketRoomGroupMobile}>
          <RoomChipRow roomChips={roomChips} activeLabel={activeLabel} onActiveChange={onActiveChange} />
        </div>

        <div className={styles.marketFilterGroup}>
          <button type="button" aria-label="Фильтр">
            <img src="/icons/filter.svg" alt="" width={20} height={20} />
            <span>Фильтр</span>
          </button>
        </div>
      </div>
    </div>
  );
}
