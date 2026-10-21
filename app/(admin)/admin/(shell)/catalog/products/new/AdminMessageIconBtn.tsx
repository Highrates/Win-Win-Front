'use client';

import qaStyles from './productQaAdmin.module.css';

type Props = {
  iconSrc: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

export function AdminMessageIconBtn({ iconSrc, label, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      className={qaStyles.iconActionBtn}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <img src={iconSrc} alt="" width={18} height={18} />
    </button>
  );
}
