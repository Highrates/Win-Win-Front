'use client';

import shared from '../tours.module.css';
import styles from './tourDetail.module.css';

function DayNavHandOutline() {
  return (
    <svg
      className={styles.dayNavOutline}
      viewBox="0 0 200 48"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <path
        className={shared.handOutlinePath}
        d="M6 24
           C5 10, 22 3, 48 2
           C88 0.8, 128 1, 158 2.5
           C182 3.8, 194 11, 194.5 24
           C195 36.5, 180 44.5, 152 46
           C118 47.8, 78 47.5, 46 45.5
           C22 44, 7 36, 6 24 Z"
        pathLength={1}
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type Day = { id: string; dayNumber: number };

type Props = {
  days: Day[];
  dayIndex: number;
  lineIndex: number;
  dayPhase: 'idle' | 'out' | 'in';
  onSelectDay: (index: number) => void;
};

export function TourDetailDayNav({ days, dayIndex, lineIndex, dayPhase, onSelectDay }: Props) {
  if (days.length === 0) return null;

  return (
    <ul className={styles.dayNav}>
      {days.map((d, i) => {
        const selected = i === dayIndex;
        const lineOn = i === lineIndex;
        const showOutline = lineOn || (dayPhase === 'out' && selected);
        return (
          <li key={d.id}>
            <button
              type="button"
              className={[
                'h5',
                styles.dayNavBtn,
                selected ? styles.dayNavBtnActive : '',
                lineOn ? styles.dayNavBtnLineOn : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDay(i)}
              aria-pressed={selected}
            >
              {showOutline ? <DayNavHandOutline /> : null}
              <span className={styles.dayNavBtnLabel}>День {d.dayNumber}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
