'use client';

import { useState, useCallback, useMemo } from 'react';
import { AccountDocRow } from '@/components/AccountDocRow/AccountDocRow';
import { SideSheetModal } from '@/components/SideSheetModal/SideSheetModal';
import styles from './BrandPage.module.css';

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

function normalizeExternalHref(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^\/\//.test(t)) return `https:${t}`;
  return `https://${t}`;
}

function siteHostLabel(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./i, '');
  } catch {
    return 'Сайт бренда';
  }
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

  const siteHref = useMemo(
    () => (siteUrl ? normalizeExternalHref(siteUrl) : null),
    [siteUrl],
  );
  const gallery = useMemo(
    () => (galleryUrls ?? []).map((u) => u.trim()).filter(Boolean).slice(0, 3),
    [galleryUrls],
  );
  const pdfHref = catalogPdfHref?.trim() || '';
  const short = shortDescription?.trim() || '';
  const logo = logoUrl?.trim() || '';

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
        <div className={styles.aboutBrandSheet}>
          {(logo || short) && (
            <header className={styles.aboutBrandIntro}>
              {logo ? (
                <img
                  src={logo}
                  alt=""
                  className={styles.aboutBrandLogo}
                  width={160}
                  height={64}
                />
              ) : null}
              {short ? <p className={styles.aboutBrandShort}>{short}</p> : null}
            </header>
          )}

          {gallery.length > 0 ? (
            <div className={styles.aboutBrandGallery} aria-label="Галерея бренда">
              {gallery.map((url, i) => (
                <img
                  key={`${url}-${i}`}
                  src={url}
                  alt=""
                  className={styles.aboutBrandGalleryImg}
                />
              ))}
            </div>
          ) : null}

          <div
            className={`${styles.richContent} rich-content`}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {(pdfHref || siteHref) && (
            <footer className={styles.aboutBrandFooter}>
              {pdfHref ? (
                <AccountDocRow
                  title="КАТАЛОГ БРЕНДА"
                  fileType={{ kind: 'pdf', badge: 'PDF' }}
                  href={pdfHref}
                  action="open"
                />
              ) : null}
              {siteHref ? (
                <a
                  href={siteHref}
                  className={styles.aboutBrandSiteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {siteHostLabel(siteHref)}
                  <ExternalArrowIcon className={styles.aboutBrandSiteArrow} />
                </a>
              ) : null}
            </footer>
          )}
        </div>
      </SideSheetModal>
    </>
  );
}
