import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { DesignerProjectsSection } from '../designers/[slug]/DesignerProjectsSection';
import type { ProjectData } from '../designers/[slug]/DesignerProjectsSection';
import { ProjectsRoomFilter } from './ProjectsRoomFilter';
/**
 * Общие стили превью, маркета и карточек проектов (те же классы, что на странице дизайнера).
 */
import listingLayoutStyles from '../designers/[slug]/DesignerPage.module.css';
import projectsStyles from './ProjectsPage.module.css';

export const metadata: Metadata = {
  title: 'Проекты и концепции — Win-Win',
  description: 'Проекты и концепции интерьеров',
};

const DESIGNER_PROJECTS = [
  { slug: 'sofa-classic', name: 'Диван Classic', price: 135090, collections: 5, likes: 180, comments: 12 },
  { slug: 'kreslo-lounge', name: 'Кресло Lounge', price: 45000, collections: 8, likes: 92, comments: 5 },
  { slug: 'stolik-round', name: 'Столик Round', price: 28500, collections: 3, likes: 45, comments: 2 },
  { slug: 'konsol-wood', name: 'Консоль Wood', price: 67200, collections: 12, likes: 210, comments: 18 },
  { slug: 'stul-comfort', name: 'Стул Comfort', price: 19900, collections: 6, likes: 78, comments: 4 },
  { slug: 'puf-velvet', name: 'Пуф Velvet', price: 12400, collections: 2, likes: 34, comments: 1 },
  { slug: 'shkaf-modern', name: 'Шкаф Modern', price: 89000, collections: 15, likes: 256, comments: 22 },
  { slug: 'lampa-arc', name: 'Лампа Arc', price: 35090, collections: 9, likes: 120, comments: 8 },
];

const PLACEHOLDER_AVATAR = '/images/placeholder.svg';

const PROJECTS_LIST: ProjectData[] = [
  {
    title: 'Название проекта',
    places: 'Гостиная, Кухня',
    description:
      'Короткое описание проекта: интерьер в светлых тонах с акцентом на натуральные материалы и функциональную мебель.',
    products: DESIGNER_PROJECTS,
    coverImage: PLACEHOLDER_AVATAR,
    coverImage2: PLACEHOLDER_AVATAR,
    designer: { name: 'Анна Иванова', slug: 'anna-ivanova', avatarSrc: PLACEHOLDER_AVATAR },
  },
  {
    title: 'Светлая гостиная',
    places: 'Гостиная, Прихожая',
    description:
      'Современный интерьер с панорамными окнами и нейтральной палитрой. Акцент на текстиле и освещении.',
    products: DESIGNER_PROJECTS,
    coverImage: PLACEHOLDER_AVATAR,
    coverImage2: PLACEHOLDER_AVATAR,
    designer: { name: 'Борис Петров', slug: 'boris-petrov', avatarSrc: PLACEHOLDER_AVATAR },
  },
  {
    title: 'Минималистичная кухня',
    places: 'Кухня',
    description:
      'Кухня-гостиная с островом и встроенной техникой. Материалы: массив дуба, кварц, матовая керамика.',
    products: DESIGNER_PROJECTS,
    coverImage: PLACEHOLDER_AVATAR,
    coverImage2: PLACEHOLDER_AVATAR,
    designer: { name: 'Мария Сидорова', slug: 'maria-sidorova', avatarSrc: PLACEHOLDER_AVATAR },
  },
  {
    title: 'Спальня с гардеробной',
    places: 'Спальня, Гардеробная',
    description:
      'Комфортная спальня с зонированием и встроенной гардеробной. Тёплые оттенки и мягкое освещение.',
    products: DESIGNER_PROJECTS,
    coverImage: PLACEHOLDER_AVATAR,
    coverImage2: PLACEHOLDER_AVATAR,
    designer: { name: 'Елена Новикова', slug: 'elena-novikova', avatarSrc: PLACEHOLDER_AVATAR },
  },
];

export default function ProjectsPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/', current: false },
    { label: 'Проекты', href: '', current: true },
  ];

  return (
    <main>
      <section className={listingLayoutStyles.previewPageSection}>
        <div className="padding-global">
          <div className={listingLayoutStyles.previewPageWrapper}>
            <div
              className={`${listingLayoutStyles.previewPageTitles} ${projectsStyles.projectsPreviewTitlesTight}`}
            >
              <nav className={listingLayoutStyles.breadcrumbs} aria-label="Хлебные крошки">
                {breadcrumbs.map((item, i) => (
                  <Fragment key={i}>
                    {i > 0 && (
                      <span className={listingLayoutStyles.breadcrumbsSep}>/</span>
                    )}
                    {item.current ? (
                      <span className={listingLayoutStyles.breadcrumbsCurrent}>{item.label}</span>
                    ) : (
                      <Link href={item.href} className={listingLayoutStyles.breadcrumbsLink}>
                        {item.label}
                      </Link>
                    )}
                  </Fragment>
                ))}
              </nav>
              <div className={projectsStyles.projectsPageHeroOuter}>
                <h1 className={projectsStyles.projectsPageHeroTitle}>
                  Проекты и концепции
                </h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`${listingLayoutStyles.marketSection} ${projectsStyles.projectsPageMarketSection}`}
        aria-label="Проекты"
      >
        <div className="padding-global">
          <div className={listingLayoutStyles.marketSectionInner}>
            <DesignerProjectsSection
              projects={PROJECTS_LIST}
              stylesModule={listingLayoutStyles}
              titlesLeft={<ProjectsRoomFilter />}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
