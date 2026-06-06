'use client';

import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';

type Props = {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

export function AdminModalCloseButton({ onClick, label, disabled, className }: Props) {
  return (
    <button
      type="button"
      className={`${catalogStyles.modalCloseIconBtn} ${className ?? ''}`.trim()}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={catalogStyles.modalCloseIconSvg}
      >
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
