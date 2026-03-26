'use client';

import { useId, useState } from 'react';
import styles from './page.module.css';

type AccordionBigProps = {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  panelClassName?: string;
};

export function AccordionBig({
  title,
  children,
  defaultOpen = false,
  className,
  panelClassName,
}: AccordionBigProps) {
  const [open, setOpen] = useState(defaultOpen);
  const accordionId = useId();
  const panelId = `accordion-big-panel-${accordionId}`;
  const triggerId = `accordion-big-trigger-${accordionId}`;

  return (
    <div className={`${styles.accordionBig} ${className ?? ''}`}>
      <button
        type="button"
        className={styles.accordionBigTrigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        id={triggerId}
      >
        <span className={styles.accordionBigTitle}>{title}</span>
        <img
          src="/icons/arrow.svg"
          alt=""
          width={22}
          height={22}
          aria-hidden
          className={`${styles.accordionBigArrow} ${open ? styles.accordionBigArrowOpen : ''}`}
        />
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className={`${styles.accordionBigPanel} ${panelClassName ?? ''}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
