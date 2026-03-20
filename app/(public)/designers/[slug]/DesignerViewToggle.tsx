'use client';

/** grid = сетка обложек; list = список проектов (полные карточки) */
export type ViewMode = 'grid' | 'list';

type Props = {
  styles: Record<string, string>;
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
};

export function DesignerViewToggle({ styles, activeView, onViewChange }: Props) {
  return (
    <div className={styles.viewToggleGroup}>
      <button
        type="button"
        className={
          activeView === 'list'
            ? `${styles.viewToggleBtn} ${styles.viewToggleBtnActive}`
            : styles.viewToggleBtn
        }
        onClick={() => onViewChange('list')}
        aria-label="Вид списком"
        aria-pressed={activeView === 'list'}
      >
        <img src="/icons/slider-vertical.svg" alt="" aria-hidden />
      </button>
      <button
        type="button"
        className={
          activeView === 'grid'
            ? `${styles.viewToggleBtn} ${styles.viewToggleBtnActive}`
            : styles.viewToggleBtn
        }
        onClick={() => onViewChange('grid')}
        aria-label="Вид сеткой"
        aria-pressed={activeView === 'grid'}
      >
        <img src="/icons/grid.svg" alt="" aria-hidden />
      </button>
    </div>
  );
}
