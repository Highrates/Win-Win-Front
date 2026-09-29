'use client';

import { useState, useCallback } from 'react';
import { SideSheetModal } from '@/components/SideSheetModal/SideSheetModal';
import styles from './DesignerPage.module.css';

type Props = {
  aboutHtml?: string | null;
  linkClassName: string;
  textClassName: string;
  arrowClassName: string;
};

export function MoreAboutDesignerModal({
  aboutHtml,
  linkClassName,
  textClassName,
  arrowClassName,
}: Props) {
  const hasBody = Boolean(aboutHtml?.trim());
  const [open, setOpen] = useState(false);
  const [panelId, setPanelId] = useState<string | undefined>();

  const openModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  if (!hasBody || !aboutHtml) return null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={linkClassName}
        aria-label="Ещё о дизайнере"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className={textClassName}>Ещё о дизайнере</span>
        <svg
          className={arrowClassName}
          width="12"
          height="7"
          viewBox="0 0 12 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M8.17993 5.62L10.7399 3.06L8.17993 0.5"
            stroke="currentColor"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M0.5 3.06006H10.67"
            stroke="currentColor"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <SideSheetModal
        open={open}
        onClose={closeModal}
        srTitle="Ещё о дизайнере"
        onPanelId={setPanelId}
      >
        <div
          className={`${styles.richContent} rich-content`}
          dangerouslySetInnerHTML={{ __html: aboutHtml }}
        />
      </SideSheetModal>
    </>
  );
}
