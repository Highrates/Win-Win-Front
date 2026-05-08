'use client';

import styles from '../page.module.css';
import type { ProjectSectionTabDef } from '../hooks/useProjectLinesDerived';

export type AccountProjectsSectionToolbarProps = {
  sectionTabs: ProjectSectionTabDef[];
  sectionTab: string;
  onSectionTabChange: (tabId: string) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onSelectAllEnter: () => void;
  onSelectAllCancel: () => void;
  onDeleteSelected: () => void;
};

export function AccountProjectsSectionToolbar({
  sectionTabs,
  sectionTab,
  onSectionTabChange,
  selectionMode,
  selectedIds,
  onSelectAllEnter,
  onSelectAllCancel,
  onDeleteSelected,
}: AccountProjectsSectionToolbarProps) {
  return (
    <>
      <div className={`${styles.sectionTabsWrapper} ${styles.tabsOffset}`} role="tablist" aria-label="Разделы проекта">
        {sectionTabs.map((tab) => {
          const isActive = tab.id === sectionTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? styles.sectionTabActive : styles.sectionTab}
              onClick={() => onSectionTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={styles.productsTopRow}>
        <div className={styles.marketSectionRowLeft}>
          <div className={styles.marketFilterGroup}>
            <button type="button" aria-label="Фильтр">
              <img src="/icons/filter.svg" alt="" width={20} height={20} />
              <span>Фильтр</span>
            </button>
          </div>
        </div>
        <div className={styles.productsTopRowActions}>
          {selectionMode ? (
            <>
              <button type="button" className={styles.selectAllCancel} onClick={onSelectAllCancel}>
                Отменить
              </button>
              <button
                type="button"
                className={styles.selectAllDelete}
                disabled={selectedIds.size === 0}
                onClick={onDeleteSelected}
              >
                <img src="/icons/delete.svg" alt="" width={20} height={20} className={styles.iconBlack} />
                Удалить
                {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </button>
            </>
          ) : (
            <button type="button" className={styles.selectAllButton} onClick={onSelectAllEnter}>
              Выбрать все
            </button>
          )}
        </div>
      </div>
    </>
  );
}
