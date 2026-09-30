'use client';

import { useEffect, useRef } from 'react';
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
  /** Закрыть при клике снаружи (для controlled open). */
  onClose?: () => void;
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
  onClose,
}: MultiSelectFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const target = e.target;
      if (!(target instanceof Node) || root.contains(target)) return;
      if (onClose) onClose();
      else if (open) onToggleOpen();
    };
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('touchstart', onDocPointer);
    return () => {
      document.removeEventListener('mousedown', onDocPointer);
      document.removeEventListener('touchstart', onDocPointer);
    };
  }, [open, onClose, onToggleOpen]);

  return (
    <div className={styles.root} ref={rootRef}>
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
