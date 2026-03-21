import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './AuthPageShell.module.css';

export interface AuthPageShellProps {
  sectionAriaLabel: string;
  title: string;
  subtitle?: ReactNode;
  /** Куда ведёт «Назад» (по умолчанию главная) */
  backHref?: string;
  children: ReactNode;
}

export function AuthPageShell({
  sectionAriaLabel,
  title,
  subtitle,
  backHref = '/',
  children,
}: AuthPageShellProps) {
  return (
    <main>
      <section className={styles.authSection} aria-label={sectionAriaLabel}>
        <div className="padding-global">
          <div className={styles.authDetailsWrapper}>
            <Link href={backHref} className={styles.authBack}>
              <img
                src="/icons/arrow-right.svg"
                alt=""
                width={12}
                height={7}
                className={styles.authBackArrow}
              />
              <span className={styles.authBackText}>Назад</span>
            </Link>

            <div className={styles.authIntro}>
              <h1 className={styles.authTitle}>{title}</h1>
              {subtitle != null && subtitle !== false ? (
                <div className={styles.authSubtitle}>{subtitle}</div>
              ) : null}
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
