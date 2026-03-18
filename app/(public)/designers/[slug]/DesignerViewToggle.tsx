'use client';

export type ViewMode = 'grid' | 'slider';

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
      <button
        type="button"
        className={
          activeView === 'slider'
            ? `${styles.viewToggleBtn} ${styles.viewToggleBtnActive}`
            : styles.viewToggleBtn
        }
        onClick={() => onViewChange('slider')}
        aria-label="Вид слайдером"
        aria-pressed={activeView === 'slider'}
      >
        <img src="/icons/slider-vertical.svg" alt="" aria-hidden />
      </button>
    </div>
  );
}
