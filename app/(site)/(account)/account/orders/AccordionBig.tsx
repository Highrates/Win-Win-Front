'use client';

import { useId, useState } from 'react';
import styles from './page.module.css';

type AccordionBigProps = {
  title: string;
  titleExtra?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  panelClassName?: string;
  headerAction?: React.ReactNode;
};

export function AccordionBig({
  title,
  titleExtra,
  children,
  defaultOpen = false,
  open: openControlled,
  onOpenChange,
  className,
  panelClassName,
  headerAction,
}: AccordionBigProps) {
  const [openInternal, setOpenInternal] = useState(defaultOpen);
  const isControlled = openControlled !== undefined;
  const open = isControlled ? openControlled : openInternal;
  const accordionId = useId();
  const panelId = `accordion-big-panel-${accordionId}`;
  const triggerId = `accordion-big-trigger-${accordionId}`;

  function setOpen(next: boolean) {
    if (!isControlled) setOpenInternal(next);
    onOpenChange?.(next);
  }

  return (
    <div className={`${styles.accordionBig} ${className ?? ''}`}>
      <div className={styles.accordionBigHeader}>
        <button
          type="button"
          className={`${styles.accordionBigTrigger} ${headerAction ? styles.accordionBigTriggerWithAction : ''}`}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={panelId}
          id={triggerId}
        >
          <span className={styles.accordionBigTitleRow}>
            <span className={styles.accordionBigTitle}>{title}</span>
            {titleExtra}
          </span>
          <img
            src="/icons/arrow.svg"
            alt=""
            width={22}
            height={22}
            aria-hidden
            className={`${styles.accordionBigArrow} ${open ? styles.accordionBigArrowOpen : ''}`}
          />
        </button>
        {headerAction ? <div className={styles.accordionBigHeaderAction}>{headerAction}</div> : null}
      </div>
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
