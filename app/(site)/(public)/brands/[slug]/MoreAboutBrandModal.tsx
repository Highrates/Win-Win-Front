'use client';

import { useState, useCallback } from 'react';
import { SideSheetModal } from '@/components/SideSheetModal/SideSheetModal';
import { BrandAboutSheetContent } from './BrandAboutSheetContent';

type Props = {
  brandName: string;
  linkClassName: string;
  textClassName: string;
  arrowClassName: string;
  /** HTML из админки (RichBlock); без контента кнопка не показывается. */
  bodyHtml?: string | null;
  shortDescription?: string | null;
  logoUrl?: string | null;
  siteUrl?: string | null;
  /** Доп. изображения бренда (галерея). */
  galleryUrls?: string[];
  /** Абсолютный URL PDF-каталога. */
  catalogPdfHref?: string | null;
};

function ExternalArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

export function MoreAboutBrandModal({
  brandName,
  linkClassName,
  textClassName,
  arrowClassName,
  bodyHtml,
  shortDescription,
  logoUrl,
  siteUrl,
  galleryUrls,
  catalogPdfHref,
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
        aria-label={`Ещё о бренде ${brandName}`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className={textClassName}>Ещё о бренде</span>
        <ExternalArrowIcon className={arrowClassName} />
      </button>
      <SideSheetModal
        open={open}
        onClose={closeModal}
        title={brandName}
        srTitle={`Ещё о бренде: ${brandName}`}
        onPanelId={setPanelId}
      >
        <BrandAboutSheetContent
          brandName={brandName}
          bodyHtml={bodyHtml}
          shortDescription={shortDescription}
          logoUrl={logoUrl}
          siteUrl={siteUrl}
          galleryUrls={galleryUrls}
          catalogPdfHref={catalogPdfHref}
        />
      </SideSheetModal>
    </>
  );
}
