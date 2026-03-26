import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { Button } from '@/components/Button';
import { getDesignerBySlug } from '@/lib/public/designers';
import { DesignerProjectsSection } from '../DesignerProjectsSection';
import { MoreAboutDesignerModal } from './MoreAboutDesignerModal';
import styles from './DesignerPage.module.css';

const DESIGNER_PROJECTS = [
  { slug: 'sofa-classic', name: 'Диван Classic', price: 135090, collections: 5, likes: 180, comments: 12 },
  { slug: 'kreslo-lounge', name: 'Кресло Lounge', price: 45000, collections: 8, likes: 92, comments: 5 },
  { slug: 'stolik-round', name: 'Столик Round', price: 28500, collections: 3, likes: 45, comments: 2 },
  { slug: 'konsol-wood', name: 'Консоль Wood', price: 67200, collections: 12, likes: 210, comments: 18 },
  { slug: 'stul-comfort', name: 'Стул Comfort', price: 19900, collections: 6, likes: 78, comments: 4 },
  { slug: 'puf-velvet', name: 'Пуф Velvet', price: 12400, collections: 2, likes: 34, comments: 1 },
  { slug: 'shkaf-modern', name: 'Шкаф Modern', price: 89000, collections: 15, likes: 256, comments: 22 },
  { slug: 'lampa-arc', name: 'Лампа Arc', price: 35090, collections: 9, likes: 120, comments: 8 },
  { slug: 'krovat-dream', name: 'Кровать Dream', price: 156000, collections: 7, likes: 189, comments: 14 },
  { slug: 'tumba-night', name: 'Тумба Night', price: 24300, collections: 4, likes: 56, comments: 3 },
  { slug: 'zerkalo-wall', name: 'Зеркало Wall', price: 31500, collections: 11, likes: 95, comments: 6 },
  { slug: 'polka-open', name: 'Полка Open', price: 14700, collections: 3, likes: 41, comments: 2 },
  { slug: 'stol-dining', name: 'Стол Dining', price: 78000, collections: 18, likes: 302, comments: 19 },
  { slug: 'bra-minimal', name: 'Бра Minimal', price: 9800, collections: 5, likes: 67, comments: 5 },
];

const DESIGNER_PROJECTS_LIST = [
  {
    title: 'Название проекта',
    places: 'Гостиная, Кухня',
    description:
      'Короткое описание проекта: интерьер в светлых тонах с акцентом на натуральные материалы и функциональную мебель.',
    products: DESIGNER_PROJECTS,
    coverImage: '/images/placeholder.svg',
    coverImage2: '/images/placeholder.svg',
  },
  {
    title: 'Светлая гостиная',
    places: 'Гостиная, Прихожая',
    description:
      'Современный интерьер с панорамными окнами и нейтральной палитрой. Акцент на текстиле и освещении.',
    products: DESIGNER_PROJECTS,
    coverImage: '/images/placeholder.svg',
    coverImage2: '/images/placeholder.svg',
  },
  {
    title: 'Минималистичная кухня',
    places: 'Кухня',
    description:
      'Кухня-гостиная с островом и встроенной техникой. Материалы: массив дуба, кварц, матовая керамика.',
    products: DESIGNER_PROJECTS,
    coverImage: '/images/placeholder.svg',
    coverImage2: '/images/placeholder.svg',
  },
  {
    title: 'Спальня с гардеробной',
    places: 'Спальня, Гардеробная',
    description:
      'Комфортная спальня с зонированием и встроенной гардеробной. Тёплые оттенки и мягкое освещение.',
    products: DESIGNER_PROJECTS,
    coverImage: '/images/placeholder.svg',
    coverImage2: '/images/placeholder.svg',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { name } = getDesignerBySlug(slug);
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
  const designer = getDesignerBySlug(slug);

  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Дизайнеры', href: '/designers', current: false },
    { label: designer.name, href: '', current: true },
  ];

  return (
    <main>
      <section className={styles.previewPageSection}>
        <div className="padding-global">
          <div className={styles.previewPageWrapper}>
            <div className={styles.previewPageTitles}>
              <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
                {breadcrumbs.map((item, i) => (
                  <Fragment key={i}>
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
              <div className={styles.previewPageTitlesOuter}>
                <div className={styles.previewPageTitlesRow}>
                  <img
                    src="/images/placeholder.svg"
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
                    <h1 className={styles.designerName}>{designer.name}</h1>
                    {designer.services && (
                      <span className={styles.designerServices}>
                        {designer.services}
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
                    <span>{designer.collections}</span>
                  </div>
                  <div className={styles.interactItem}>
                    <img
                      src="/icons/heart.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.interactIcon}
                    />
                    <span>{designer.likes}</span>
                  </div>
                </div>
                <MoreAboutDesignerModal
                      designer={{
                        name: designer.name,
                        city: designer.city,
                        services: designer.services,
                      }}
                      linkClassName={styles.moreAboutDesignerLink}
                      textClassName={styles.moreAboutDesignerText}
                      arrowClassName={styles.moreAboutDesignerArrow}
                    />
              </div>
            </div>
            <div className={styles.previewImages}>
              <div className={styles.previewImageSlot}>
                <button
                  type="button"
                  className={styles.thumbZoomBtn}
                  aria-label="Открыть галерею во весь экран"
                >
                  <img src="/icons/zoom-in.svg" alt="" aria-hidden />
                </button>
                <img
                  src="/images/placeholder.svg"
                  alt=""
                  className={styles.previewImage}
                  width={406}
                  height={393}
                />
              </div>
              <img
                src="/images/placeholder.svg"
                alt=""
                className={styles.previewImage}
                width={406}
                height={393}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.marketSection} aria-label="Работы дизайнера">
        <div className="padding-global">
          <div className={styles.marketSectionInner}>
            <DesignerProjectsSection projects={DESIGNER_PROJECTS_LIST} stylesModule={styles} />
          </div>
        </div>
      </section>
    </main>
  );
}
