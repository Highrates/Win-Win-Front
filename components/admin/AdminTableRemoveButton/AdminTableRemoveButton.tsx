'use client';

import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';

type Props = {
  onClick: () => void;
  label: string;
  disabled?: boolean;
};

/** Компактный красный крестик в круге для колонки действий таблицы. */
export function AdminTableRemoveButton({ onClick, label, disabled }: Props) {
  return (
    <button
      type="button"
      className={catalogStyles.tableRemoveIconBtn}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={catalogStyles.tableRemoveIconSvg}
      >
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
