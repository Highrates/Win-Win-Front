import styles from './Button.module.css';

/** Chevron как в Header menuChevron (Black) */
function ButtonChevron() {
  return (
    <span className={styles.btnChevron} aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="5" viewBox="0 0 9 5" fill="none">
        <path d="M0 0L4.5 5L9 0" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'secondary' | 'primary';
  /** Путь к иконке слева (20×20) */
  iconLeft?: string;
  /** Показать Chevron справа (как в Header) */
  iconRightChevron?: boolean;
  children?: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  type = 'button',
  className,
  iconLeft,
  iconRightChevron,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${variant === 'primary' ? styles.btnPrimary : styles.btnSecondary} ${className ?? ''}`}
      {...rest}
    >
      {iconLeft && (
        <img src={iconLeft} alt="" width={20} height={20} className={styles.btnIcon} aria-hidden />
      )}
      {children != null && children !== '' && <span>{children}</span>}
      {iconRightChevron && <ButtonChevron />}
    </button>
  );
}
