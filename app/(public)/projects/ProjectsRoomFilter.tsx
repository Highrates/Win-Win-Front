'use client';

import styles from './ProjectsPage.module.css';

type Props = {
  /** Первый элемент — «Все пространства», далее уникальные помещения из опубликованных кейсов */
  roomChips: string[];
  activeLabel: string;
  onActiveChange: (label: string) => void;
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

export function ProjectsRoomFilter({ roomChips, activeLabel, onActiveChange }: Props) {
  return (
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
  );
}
