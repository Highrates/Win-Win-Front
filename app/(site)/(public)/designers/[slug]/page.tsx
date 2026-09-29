import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Button } from '@/components/Button';
import { DesignerProjectsSection } from '../DesignerProjectsSection';
import { MoreAboutDesignerModal } from './MoreAboutDesignerModal';
import { DesignerLikeInteract } from '@/components/DesignerLikeInteract/DesignerLikeInteract';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';
import {
  DESIGNER_CASES_PAGE_SIZE,
  designerPageMetadata,
  designerProjectsFromPayload,
  loadPublicDesignerBySlug,
} from '@/lib/designersPublicServer';
import { getServerRequestOrigin } from '@/lib/serverRequestOrigin';
import styles from './DesignerPage.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadPublicDesignerBySlug(slug);
  if (result.status !== 'ok') {
    return { title: 'Дизайнер — Wupapa' };
  }
  const siteOrigin = await getServerRequestOrigin();
  return designerPageMetadata(result.designer, { siteOrigin });
}

export default async function DesignerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadPublicDesignerBySlug(slug);
  if (result.status === 'not_found') notFound();
  if (result.status === 'error') {
    throw new Error(result.message);
  }
  const designer = result.designer;

  const avatarSrc = designer.photoUrl?.trim() ? designer.photoUrl.trim() : '/images/placeholder.svg';
  const previewCoverUrl = designer.coverImageUrls[0]?.trim() || null;

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
                    {i > 0 && <span className={styles.breadcrumbsSep}>/</span>}
                    {item.current ? (
                      <span className={styles.breadcrumbsCurrent}>{item.label}</span>
                    ) : (
                      <Link href={item.href} className={styles.breadcrumbsLink}>
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
                      alt={designer.displayName}
                      className={styles.designerAvatar}
                      width={82}
                      height={82}
                    />
                    <div className={styles.designerTitlesCol}>
                      {designer.city && (
                        <span className={styles.designerCity}>{designer.city}</span>
                      )}
                      <h1 className={styles.designerName}>{designer.displayName}</h1>
                      {designer.servicesLine && (
                        <span className={styles.designerServices}>{designer.servicesLine}</span>
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
                    <div
                      className={styles.interactItem}
                      aria-label={`Проектов: ${Math.max(0, designer.casesCount ?? 0)}`}
                    >
                      <img
                        src="/icons/collections.svg"
                        alt=""
                        width={20}
                        height={20}
                        className={styles.interactIcon}
                        aria-hidden
                      />
                      <span className={styles.interactValue} aria-hidden>
                        {Math.max(0, designer.casesCount ?? 0)}
                      </span>
                    </div>
                    {designer.id ? (
                      <DesignerLikeInteract
                        designerId={designer.id}
                        likesDisplayCount={Math.max(0, designer.likesDisplayCount ?? 0)}
                        classNames={{
                          interactItem: styles.interactItem,
                          interactIcon: styles.interactIcon,
                          interactValue: styles.interactValue,
                          heartIconActive: styles.heartIconActive,
                        }}
                      />
                    ) : (
                      <div className={styles.interactItem}>
                        <LikeHeartSvg className={styles.interactIcon} />
                        <span className={styles.interactValue}>0</span>
                      </div>
                    )}
                  </div>
                  <MoreAboutDesignerModal
                    aboutHtml={designer.aboutHtml}
                    linkClassName={styles.moreAboutDesignerLink}
                    textClassName={styles.moreAboutDesignerText}
                    arrowClassName={styles.moreAboutDesignerArrow}
                  />
                </div>
              </div>
            </div>
            {previewCoverUrl ? (
              <div className={styles.previewImages}>
                <div className={styles.previewImageSlot}>
                  <img
                    src={previewCoverUrl}
                    alt={`Обложка профиля ${designer.displayName}`}
                    className={styles.previewImage}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.marketSection} aria-label="Работы дизайнера">
        <div className="padding-global">
          <div className={styles.marketSectionInner}>
            <DesignerProjectsSection
              projects={designerProjectsFromPayload(designer)}
              stylesModule={styles}
              gridOnly
              productFilterTabs
              casesPagination={{
                mode: 'designer',
                designerSlug: designer.slug,
                total: designer.casesTotal,
                pageSize: DESIGNER_CASES_PAGE_SIZE,
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
