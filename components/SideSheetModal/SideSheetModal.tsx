'use client';

import { useState, useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import styles from './SideSheetModal.module.css';

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3.75 9.25V3.75H9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.25 12.75V18.25H12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66678 4.66665L9.55566 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.4441 12.4444L17.333 17.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9.25 18.25V12.75H3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.75 3.75V9.25H18.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.333 17.3333L12.4444 12.4444" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66699 4.66665L9.55588 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** Видимый заголовок в sticky-шапке; без него — только sr-only */
  title?: ReactNode;
  /** Текст для screen reader / fallback aria */
  srTitle: string;
  children: ReactNode;
  /** Сообщить снаружи id панели (для aria-controls у триггера) */
  onPanelId?: (panelId: string | undefined) => void;
};

export function SideSheetModal({ open, onClose, title, srTitle, children, onPanelId }: Props) {
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const panelId = `${reactId}-panel`;
  const panelRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const handleClose = useCallback(() => {
    setFullscreen(false);
    onClose();
  }, [onClose]);

  const toggleFullscreen = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setFullscreen((v) => !v);
  }, []);

  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    onPanelId?.(open ? panelId : undefined);
  }, [open, panelId, onPanelId]);

  useEffect(() => {
    if (!open) {
      setFullscreen(false);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={handleClose} role="presentation" aria-hidden />
      <div
        ref={panelRef}
        id={panelId}
        className={`${styles.panel} ${fullscreen ? styles.panelFullscreen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerPadding}>
            {title ? (
              <h2 id={titleId} className={styles.headerTitle}>
                {title}
              </h2>
            ) : (
              <span id={titleId} className={styles.srOnly}>
                {srTitle}
              </span>
            )}
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={toggleFullscreen}
                aria-label={fullscreen ? 'Выйти из полноэкранного режима' : 'Открыть во весь экран'}
              >
                {fullscreen ? <CollapseIcon /> : <ExpIcon />}
              </button>
              <button type="button" className={styles.iconBtn} onClick={handleClose} aria-label="Закрыть">
                <CloseIcon />
              </button>
            </div>
          </div>
        </header>
        <div className={styles.content}>
          <div className={styles.contentPad}>{children}</div>
        </div>
      </div>
    </>
  );
}
