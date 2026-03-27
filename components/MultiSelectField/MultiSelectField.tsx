'use client';

import textFieldStyles from '@/components/TextField/TextField.module.css';
import styles from './MultiSelectField.module.css';

type MultiSelectFieldProps = {
  label: string;
  placeholder: string;
  options: readonly string[];
  selected: string[];
  open: boolean;
  onToggleOpen: () => void;
  onToggleOption: (value: string) => void;
  onRemoveOption: (value: string) => void;
};

export function MultiSelectField({
  label,
  placeholder,
  options,
  selected,
  open,
  onToggleOpen,
  onToggleOption,
  onRemoveOption,
}: MultiSelectFieldProps) {
  return (
    <div className={styles.root}>
      <span className={styles.label}>{label}</span>
      <div className={styles.multiSelect}>
        <button
          type="button"
          className={`${textFieldStyles.input} ${styles.trigger}`}
          onClick={onToggleOpen}
          aria-expanded={open}
        >
          <span className={styles.chips}>
            {selected.length === 0 ? (
              <span className={styles.placeholder}>{placeholder}</span>
            ) : (
              selected.map((item) => (
                <span key={item} className={styles.chip}>
                  {item}
                  <span
                    role="button"
                    tabIndex={0}
                    className={styles.chipRemove}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveOption(item);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveOption(item);
                      }
                    }}
                  >
                    ×
                  </span>
                </span>
              ))
            )}
          </span>
          <img
            src="/icons/arrow.svg"
            alt=""
            width={22}
            height={22}
            aria-hidden
            className={styles.chevron}
            style={{ transform: open ? 'rotate(-90deg)' : 'rotate(90deg)' }}
          />
        </button>
        {open ? (
          <div className={styles.options}>
            {options.map((item) => {
              const active = selected.includes(item);
              return (
                <button key={item} type="button" className={styles.option} onClick={() => onToggleOption(item)}>
                  <span>{item}</span>
                  {active ? <span className={styles.check}>✓</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
