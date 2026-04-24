'use client';

import styles from './CoverGridField.module.css';

export type CoverGrid = '4:3' | '16:9';

type CoverFileChangeHandlers = {
  onChange43a: (file: File | null) => void;
  onChange43b: (file: File | null) => void;
  onChange169: (file: File | null) => void;
};

type CoverFileRemoveHandlers = {
  onRemove43a: () => void;
  onRemove43b: () => void;
  onRemove169: () => void;
};

export type CoverGridFieldProps = {
  coverGrid: CoverGrid;
  onCoverGridChange: (grid: CoverGrid) => void;
  cover43a: File | null;
  cover43b: File | null;
  cover169: File | null;
  cover43aPreview: string | null;
  cover43bPreview: string | null;
  cover169Preview: string | null;
  onFileChange: CoverFileChangeHandlers;
  onFileRemove: CoverFileRemoveHandlers;
  /** If false, the «Выберите сетку…» line is not rendered (e.g. designer profile cover). */
  showGridLayoutLabel?: boolean;
};

export function CoverGridField({
  coverGrid,
  onCoverGridChange,
  cover43a,
  cover43b,
  cover169,
  cover43aPreview,
  cover43bPreview,
  cover169Preview,
  onFileChange,
  onFileRemove,
  showGridLayoutLabel = true,
}: CoverGridFieldProps) {
  return (
    <div className={styles.field}>
      {showGridLayoutLabel ? (
        <span className={styles.label}>Выберите сетку отображения обложки кейса</span>
      ) : null}
      <div className={styles.gridOptions}>
        <button
          type="button"
          className={styles.gridOption}
          onClick={() => onCoverGridChange('4:3')}
          aria-pressed={coverGrid === '4:3'}
        >
          <span className={styles.gridOptionTop}>
            <span className={styles.gridOptionLeft}>
              <span className={`${styles.gridRadio} ${coverGrid === '4:3' ? styles.gridRadioChecked : ''}`} />
              <span>2 изображения 4:3</span>
            </span>
            <span className={styles.gridRatio}>4:3</span>
          </span>
          <span className={styles.uploadGrid43}>
            <label
              className={`${styles.uploadBox43} ${coverGrid !== '4:3' ? styles.uploadBoxDisabled : ''}`}
              style={cover43aPreview ? { backgroundImage: `url(${cover43aPreview})` } : undefined}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="file"
                accept="image/*"
                className={styles.uploadInput}
                disabled={coverGrid !== '4:3'}
                onChange={(e) => onFileChange.onChange43a(e.target.files?.[0] ?? null)}
              />
              <span className={styles.uploadCaption}>{cover43a ? cover43a.name : 'Загрузить фото'}</span>
              {cover43a ? (
                <button
                  type="button"
                  className={styles.uploadRemove}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFileRemove.onRemove43a();
                  }}
                >
                  Удалить
                </button>
              ) : null}
            </label>
            <label
              className={`${styles.uploadBox43} ${coverGrid !== '4:3' ? styles.uploadBoxDisabled : ''}`}
              style={cover43bPreview ? { backgroundImage: `url(${cover43bPreview})` } : undefined}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="file"
                accept="image/*"
                className={styles.uploadInput}
                disabled={coverGrid !== '4:3'}
                onChange={(e) => onFileChange.onChange43b(e.target.files?.[0] ?? null)}
              />
              <span className={styles.uploadCaption}>{cover43b ? cover43b.name : 'Загрузить фото'}</span>
              {cover43b ? (
                <button
                  type="button"
                  className={styles.uploadRemove}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFileRemove.onRemove43b();
                  }}
                >
                  Удалить
                </button>
              ) : null}
            </label>
          </span>
        </button>

        <button
          type="button"
          className={styles.gridOption}
          onClick={() => onCoverGridChange('16:9')}
          aria-pressed={coverGrid === '16:9'}
        >
          <span className={styles.gridOptionTop}>
            <span className={styles.gridOptionLeft}>
              <span className={`${styles.gridRadio} ${coverGrid === '16:9' ? styles.gridRadioChecked : ''}`} />
              <span>1 изображение 16:9</span>
            </span>
            <span className={styles.gridRatio}>16:9</span>
          </span>
          <label
            className={`${styles.uploadBox169} ${coverGrid !== '16:9' ? styles.uploadBoxDisabled : ''}`}
            style={cover169Preview ? { backgroundImage: `url(${cover169Preview})` } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="file"
              accept="image/*"
              className={styles.uploadInput}
              disabled={coverGrid !== '16:9'}
              onChange={(e) => onFileChange.onChange169(e.target.files?.[0] ?? null)}
            />
            <span className={styles.uploadCaption}>{cover169 ? cover169.name : 'Загрузить фото'}</span>
            {cover169 ? (
              <button
                type="button"
                className={styles.uploadRemove}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFileRemove.onRemove169();
                }}
              >
                Удалить
              </button>
            ) : null}
          </label>
        </button>
      </div>
    </div>
  );
}
