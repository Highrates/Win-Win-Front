'use client';

import { useMemo } from 'react';
import { AccountDocRow } from '@/components/AccountDocRow/AccountDocRow';
import styles from './BrandPage.module.css';

type Props = {
  brandName: string;
  bodyHtml?: string | null;
  shortDescription?: string | null;
  logoUrl?: string | null;
  siteUrl?: string | null;
  galleryUrls?: string[];
  catalogPdfHref?: string | null;
};

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

/** Контент сайдшита «Ещё о бренде» — общий для страницы бренда и туров. */
export function BrandAboutSheetContent({
  brandName,
  bodyHtml,
  shortDescription,
  logoUrl,
  siteUrl,
  galleryUrls,
  catalogPdfHref,
}: Props) {
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
  const html = bodyHtml?.trim() || '';

  return (
    <div className={styles.aboutBrandSheet}>
      {(logo || short) && (
        <header className={styles.aboutBrandIntro}>
          {logo ? (
            <img src={logo} alt="" className={styles.aboutBrandLogo} width={160} height={64} />
          ) : null}
          {short ? <p className={styles.aboutBrandShort}>{short}</p> : null}
        </header>
      )}

      {gallery.length > 0 ? (
        <div className={styles.aboutBrandGallery} aria-label={`Галерея ${brandName}`}>
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

      {html ? (
        <div
          className={`${styles.richContent} rich-content`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}

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
  );
}
