import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Button } from '@/components/Button';
import { DesignerProjectsSection } from '../DesignerProjectsSection';
import { MoreAboutDesignerModal } from './MoreAboutDesignerModal';
import { getServerApiBase } from '@/lib/serverApiBase';
import {
  mapPublicCaseToProjectData,
  parseCoverUrls,
  type PublicCasePayload,
} from '@/lib/mapPublicCaseToProjectData';
import { parseNestPublicCaseItem } from '@/lib/parseNestPublicCase';
import styles from './DesignerPage.module.css';

type PublicDesignerPayload = {
  slug: string;
  displayName: string;
  photoUrl: string | null;
  city: string | null;
  servicesLine: string | null;
  coverLayout: '4:3' | '16:9';
  coverImageUrls: string[];
  aboutHtml: string | null;
  cases: PublicCasePayload[];
};

async function fetchDesigner(slug: string): Promise<PublicDesignerPayload | null> {
  const base = getServerApiBase();
  try {
    const res = await fetch(`${base}/designers/${encodeURIComponent(slug)}`, {
      next: { revalidate: 120 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const raw = (await res.json()) as Record<string, unknown>;
    const coverUrls = parseCoverUrls(raw.coverImageUrls);
    const layoutRaw = raw.coverLayout === '16:9' ? '16:9' : '4:3';
    const cases: PublicCasePayload[] = [];
    if (Array.isArray(raw.cases)) {
      for (const row of raw.cases) {
        const parsed = parseNestPublicCaseItem(row);
        if (parsed) cases.push(parsed.case);
      }
    }
    return {
      slug: String(raw.slug ?? slug),
      displayName: String(raw.displayName ?? ''),
      photoUrl: typeof raw.photoUrl === 'string' ? raw.photoUrl : null,
      city: typeof raw.city === 'string' ? raw.city : null,
      servicesLine: typeof raw.servicesLine === 'string' ? raw.servicesLine : null,
      coverLayout: layoutRaw,
      coverImageUrls: coverUrls,
      aboutHtml: typeof raw.aboutHtml === 'string' ? raw.aboutHtml : null,
      cases,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await fetchDesigner(slug);
  const name = d?.displayName?.trim() || 'Дизайнер';
  return {
    title: `${name} — Дизайнер — Win-Win`,
    description: `Страница дизайнера ${name}`,
  };
}

export default async function DesignerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const designer = await fetchDesigner(slug);
  if (!designer) notFound();

  const avatarSrc = designer.photoUrl?.trim() ? designer.photoUrl.trim() : '/images/placeholder.svg';

  const coverUrlsForPreview =
    designer.coverLayout === '16:9'
      ? designer.coverImageUrls.slice(0, 1)
      : designer.coverImageUrls.slice(0, 2);
  const showPreviewImages = coverUrlsForPreview.length > 0;
  const isSinglePreviewImageWide = coverUrlsForPreview.length === 1;

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Дизайнеры', href: '/designers', current: false },
    { label: designer.displayName, href: '', current: true },
  ];

  return (
    <main>
      <section className={styles.previewPageSection}>
        <div className="padding-global">
          <div className={styles.previewPageWrapper}>
            <div className={styles.previewPageTitles}>
              <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
                {breadcrumbs.map((item, i) => (
                  <Fragment key={`${item.href}-${i}`}>
                    {i > 0 && (
                      <span className={styles.breadcrumbsSep}>/</span>
                    )}
                    {item.current ? (
                      <span className={styles.breadcrumbsCurrent}>
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className={styles.breadcrumbsLink}
                      >
                        {item.label}
                      </Link>
                    )}
                  </Fragment>
                ))}
              </nav>
              <div className={styles.previewPageTitlesBody}>
                <div className={styles.previewPageTitlesOuter}>
                  <div className={styles.previewPageTitlesRow}>
                    <img
                      src={avatarSrc}
                      alt=""
                      className={styles.designerAvatar}
                      width={82}
                      height={82}
                    />
                    <div className={styles.designerTitlesCol}>
                      {designer.city && (
                        <span className={styles.designerCity}>
                          {designer.city}
                        </span>
                      )}
                      <h1 className={styles.designerName}>{designer.displayName}</h1>
                      {designer.servicesLine && (
                        <span className={styles.designerServices}>
                          {designer.servicesLine}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.interactWrapper}>
                    <Button
                      type="button"
                      variant="secondary"
                      iconLeft="/icons/message.svg"
                      className={styles.contactBtn}
                      aria-label="Связаться"
                    >
                      Связаться
                    </Button>
                    <div className={styles.interactItem}>
                      <img
                        src="/icons/collections.svg"
                        alt=""
                        width={20}
                        height={20}
                        className={styles.interactIcon}
                      />
                      <span>0</span>
                    </div>
                    <div className={styles.interactItem}>
                      <img
                        src="/icons/heart.svg"
                        alt=""
                        width={20}
                        height={20}
                        className={styles.interactIcon}
                      />
                      <span>0</span>
                    </div>
                  </div>
                  <MoreAboutDesignerModal
                    designer={{
                      name: designer.displayName,
                      city: designer.city ?? '',
                      services: designer.servicesLine ?? '',
                    }}
                    aboutHtml={designer.aboutHtml}
                    linkClassName={styles.moreAboutDesignerLink}
                    textClassName={styles.moreAboutDesignerText}
                    arrowClassName={styles.moreAboutDesignerArrow}
                  />
                </div>
              </div>
            </div>
            {showPreviewImages ? (
              <div className={styles.previewImages}>
                {coverUrlsForPreview.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className={`${styles.previewImageSlot} ${
                      isSinglePreviewImageWide && i === 0 ? styles.previewImageSlotDouble : ''
                    }`}
                  >
                    <img src={url} alt="" className={styles.previewImage} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.marketSection} aria-label="Работы дизайнера">
        <div className="padding-global">
          <div className={styles.marketSectionInner}>
            <DesignerProjectsSection
              projects={designer.cases.map((c) => mapPublicCaseToProjectData(c))}
              stylesModule={styles}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
