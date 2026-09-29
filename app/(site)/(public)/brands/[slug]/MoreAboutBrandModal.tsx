'use client';

import { useState, useCallback } from 'react';
import { SideSheetModal } from '@/components/SideSheetModal/SideSheetModal';
import styles from './BrandPage.module.css';

type Props = {
  linkClassName: string;
  textClassName: string;
  arrowClassName: string;
  /** HTML из админки (RichBlock); без контента кнопка не показывается. */
  bodyHtml?: string | null;
};

export function MoreAboutBrandModal({
  linkClassName,
  textClassName,
  arrowClassName,
  bodyHtml,
}: Props) {
  const hasBody = Boolean(bodyHtml?.trim());
  const [open, setOpen] = useState(false);
  const [panelId, setPanelId] = useState<string | undefined>();

  const openModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  if (!hasBody || !bodyHtml) return null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={linkClassName}
        aria-label="Ещё о бренде"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className={textClassName}>Ещё о бренде</span>
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
        srTitle="Ещё о бренде"
        onPanelId={setPanelId}
      >
        <div
          className={`${styles.richContent} rich-content`}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </SideSheetModal>
    </>
  );
}
