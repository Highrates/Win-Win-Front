'use client';

import { useState } from 'react';
import styles from './ProjectsPage.module.css';

const ROOMS = ['Гостиная', 'Кухня'] as const;

export function ProjectsRoomFilter() {
  const [room, setRoom] = useState<(typeof ROOMS)[number]>('Гостиная');

  return (
    <div className={styles.marketSectionRowLeft}>
      <div className={styles.marketRoomGroupDesktop}>
        <div className={styles.marketRoomGroupWrap}>
          <div
            className={styles.marketRoomGroup}
            role="group"
            aria-label="Выбор помещения"
          >
            {ROOMS.map((label) => (
              <button
                key={label}
                type="button"
                className={label === room ? styles.marketRoomBtnActive : styles.marketRoomBtn}
                aria-pressed={label === room}
                onClick={() => setRoom(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.marketRoomGroupMobile}>
        <div className={styles.marketRoomMobileTrigger}>
          <span className={styles.marketRoomMobileTriggerLabel}>{room}</span>
          <svg
            className={styles.marketRoomMobileChevron}
            width={18}
            height={18}
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden
          >
            <path
              d="M6 9l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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
