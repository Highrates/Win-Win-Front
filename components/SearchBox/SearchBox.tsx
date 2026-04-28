import type { ChangeEventHandler } from 'react';
import styles from './SearchBox.module.css';

type SearchBoxProps = {
  placeholder: string;
  ariaLabel: string;
  className?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="19"
      height="19"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9.58329 17.5C13.9555 17.5 17.5 13.9556 17.5 9.58333C17.5 5.21108 13.9555 1.66667 9.58329 1.66667C5.21104 1.66667 1.66663 5.21108 1.66663 9.58333C1.66663 13.9556 5.21104 17.5 9.58329 17.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.3333 18.3333L16.6666 16.6667"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchBox({ placeholder, ariaLabel, className, value, onChange }: SearchBoxProps) {
  return (
    <div className={`${styles.searchBoxInner} ${className ?? ''}`}>
      <div className={styles.searchRow}>
        <SearchIcon className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder={placeholder}
          aria-label={ariaLabel}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
