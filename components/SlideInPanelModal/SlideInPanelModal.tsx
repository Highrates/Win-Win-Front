'use client';

import type { ReactNode } from 'react';
import { useModalBodyLock } from '@/hooks/useModalBodyLock';
import panelStyles from './slideInPanelModal.module.css';

export { panelStyles as slideInPanelModalStyles };

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M15 5L5 15M5 5l10 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type SlideInPanelModalProps = {
  open: boolean;
  onClose: () => void;
  /** aria-label для секции dialog */
  ariaLabel: string;
  /** aria-label для backdrop; по умолчанию «Закрыть» */
  backdropAriaLabel?: string;
  /** Доп. классы панели (panelFullscreen, panelOrderWide и т.д.) */
  panelClassName?: string;
  /** Узлы в шапке слева от кнопки закрытия (напр. fullscreen) */
  headerStart?: ReactNode;
  children: ReactNode;
};

export function SlideInPanelModal({
  open,
  onClose,
  ariaLabel,
  backdropAriaLabel = 'Закрыть',
  panelClassName,
  headerStart,
  children,
}: SlideInPanelModalProps) {
  useModalBodyLock(open, onClose);

  if (!open) return null;

  const panelClass = [panelStyles.panel, panelClassName].filter(Boolean).join(' ');

  return (
    <>
      <button
        type="button"
        className={panelStyles.backdrop}
        aria-label={backdropAriaLabel}
        onClick={onClose}
      />
      <section className={panelClass} role="dialog" aria-modal="true" aria-label={ariaLabel}>
        <header className={panelStyles.header}>
          {headerStart}
          <button type="button" className={panelStyles.iconBtn} onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </header>
        {children}
      </section>
    </>
  );
}
