'use client';

import styles from './AccountProjectTabs.module.css';
import { ACCOUNT_PROJECT_NAMES } from './accountProjectNames';

type AccountProjectTabsProps = {
  projects?: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function AccountProjectTabs({
  projects = ACCOUNT_PROJECT_NAMES,
  selectedIndex,
  onSelect,
}: AccountProjectTabsProps) {
  const list = projects.length ? projects : ACCOUNT_PROJECT_NAMES;

  return (
    <div className={styles.tabsWrapper} role="tablist" aria-label="Проекты">
      <div className={styles.tabsInner}>
        {list.map((label, index) => (
          <button
            key={`${label}-${index}`}
            type="button"
            role="tab"
            aria-selected={index === selectedIndex}
            className={`${styles.tab} ${index === selectedIndex ? styles.tabActive : ''}`}
            onClick={() => onSelect(index)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
