import styles from './TBtn.module.css';

export type TBtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  /** Стрелка вниз справа (иконка как `/icons/arrow.svg`, 18×18, серый stroke). */
  trailingChevronDown?: boolean;
  /** Прозрачный фон, без рамки. */
  variant?: 'default' | 'ghost' | 'danger';
};

function ChevronDownIcon() {
  return (
    <img
      src="/icons/arrow.svg"
      alt=""
      width={18}
      height={18}
      className={styles.tbtnChevronDown}
      aria-hidden
    />
  );
}

/** Компактная кнопка тулбара (даты, фильтры) — обводка как account hairline. */
export function TBtn({
  children,
  className,
  type = 'button',
  trailingChevronDown,
  variant = 'default',
  ...rest
}: TBtnProps) {
  const variantClass =
    variant === 'ghost' ? styles.tbtnGhost : variant === 'danger' ? styles.tbtnDanger : '';
  return (
    <button
      type={type}
      className={`${styles.tbtn} ${variantClass} ${className ?? ''}`.trim()}
      {...rest}
    >
      {children}
      {trailingChevronDown ? <ChevronDownIcon /> : null}
    </button>
  );
}
