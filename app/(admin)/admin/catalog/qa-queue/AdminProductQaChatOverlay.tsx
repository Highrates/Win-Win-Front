'use client';

import { createPortal } from 'react-dom';
import { useEffect, useId, useRef, useState } from 'react';
import { ProductCorrespondenceAdminPanel } from '../products/new/ProductCorrespondenceAdminPanel';
import { ProductQaAdminPanel } from '../products/new/ProductQaAdminPanel';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductQaQueueStrings } from '@/lib/admin-i18n/adminProductQaQueueI18n';
import { useModalFocusTrap } from '@/lib/useModalFocusTrap';
import chatStyles from '@/components/ChatWindow/ChatWindow.module.css';
import styles from './AdminProductQaChatOverlay.module.css';

export type AdminQaChatTab = 'correspondence' | 'qa';

type Props = {
  productId: string;
  productName: string;
  initialTab?: AdminQaChatTab;
  onClose: () => void;
};

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M5 5L15 15M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AdminProductQaChatOverlay({
  productId,
  productName,
  initialTab = 'correspondence',
  onClose,
}: Props) {
  const { locale } = useAdminLocale();
  const s = adminProductQaQueueStrings(locale);
  const [tab, setTab] = useState<AdminQaChatTab>(initialTab);
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useModalFocusTrap(true, panelRef);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`${chatStyles.root} ${visible ? chatStyles.rootVisible : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        className={`${chatStyles.panel} ${styles.panel}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={`${chatStyles.panelInner} ${styles.panelInner}`}>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {productName}
            </h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={s.closeOverlay}>
              <CloseIcon />
            </button>
          </header>

          <div className={styles.tabs} role="tablist" aria-label={s.chatChannelTabs}>
            <button
              type="button"
              role="tab"
              id="admin-qa-tab-correspondence"
              aria-selected={tab === 'correspondence'}
              aria-controls="admin-qa-panel-correspondence"
              className={tab === 'correspondence' ? styles.tabActive : styles.tab}
              onClick={() => setTab('correspondence')}
            >
              {s.tabCorrespondence}
            </button>
            <button
              type="button"
              role="tab"
              id="admin-qa-tab-qa"
              aria-selected={tab === 'qa'}
              aria-controls="admin-qa-panel-qa"
              className={tab === 'qa' ? styles.tabActive : styles.tab}
              onClick={() => setTab('qa')}
            >
              {s.tabQa}
            </button>
          </div>

          <div className={styles.tabPanels}>
            <div
              className={styles.tabPanel}
              id="admin-qa-panel-correspondence"
              role="tabpanel"
              aria-labelledby="admin-qa-tab-correspondence"
              hidden={tab !== 'correspondence'}
            >
              <ProductCorrespondenceAdminPanel productId={productId} presentation="queue" />
            </div>
            <div
              className={styles.tabPanel}
              id="admin-qa-panel-qa"
              role="tabpanel"
              aria-labelledby="admin-qa-tab-qa"
              hidden={tab !== 'qa'}
            >
              <ProductQaAdminPanel productId={productId} presentation="queue" />
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
