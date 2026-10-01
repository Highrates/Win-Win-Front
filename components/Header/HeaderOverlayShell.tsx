'use client';

import type { ReactNode, RefObject } from 'react';
import styles from './Header.module.css';

export type HeaderOverlayShellProps = {
  id: string;
  open: boolean;
  closing: boolean;
  contentRevealed: boolean;
  onClose: () => void;
  ariaLabel: string;
  panelRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  className?: string;
  slideWrapClassName?: string;
  panelClassName?: string;
  scrimClassName?: string;
  scrimLabel?: string;
};

/**
 * Shared DOM shell for header slide-down overlays:
 * scrim + dialog (superMenu) + slideWrap + bg + panel.
 */
export function HeaderOverlayShell({
  id,
  open,
  closing,
  contentRevealed,
  onClose,
  ariaLabel,
  panelRef,
  children,
  className,
  slideWrapClassName,
  panelClassName,
  scrimClassName,
  scrimLabel = 'Закрыть',
}: HeaderOverlayShellProps) {
  if (!open && !closing) return null;

  return (
    <>
      <button
        type="button"
        className={[styles.searchScrim, scrimClassName].filter(Boolean).join(' ')}
        aria-label={scrimLabel}
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        id={id}
        ref={panelRef as RefObject<HTMLDivElement>}
        className={[
          styles.superMenu,
          closing ? styles.superMenuClosing : '',
          contentRevealed ? styles.superMenuContentRevealed : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div
          className={[styles.superMenuSlideWrap, slideWrapClassName].filter(Boolean).join(' ')}
        >
          <div className={styles.superMenuBg} aria-hidden />
          <div className={[styles.superMenuPanel, panelClassName].filter(Boolean).join(' ')}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
