'use client';

import Link from 'next/link';
import {
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
  type ReactNode,
} from 'react';
import { ProductCardSmall } from '@/components/ProductCardSmall';
import { DesignerViewToggle, type ViewMode } from './[slug]/DesignerViewToggle';
import { MoreAboutProjectModal, type ProjectProduct } from './[slug]/MoreAboutProjectModal';

export type ProjectDesignerLink = {
  name: string;
  slug: string;
  avatarSrc: string;
};

export type ProjectData = {
  /** Стабильный ключ списка/сетки (id кейса) */
  id?: string;
  title: string;
  places: string;
  /** Типы помещений из кейса (для фильтра на /projects) */
  roomTypes?: string[];
  description: string;
  /** HTML описания кейса (RichBlock) для модалки */
  descriptionHtml?: string | null;
  products: ProjectProduct[];
  coverImage: string;
  /** Second image for grid block (optional) */
  coverImage2?: string;
  /** Обложка для вида «сетка» (только кейсы; обычно первая из обложек) */
  gridCoverImage?: string;
  /** Ссылка на дизайнера (страница проектов и т.п.) */
  designer?: ProjectDesignerLink;
};

type Props = {
  projects: ProjectData[];
  stylesModule: Record<string, string>;
  /** Вместо заголовка «Проекты» в строке с переключателем вида */
  titlesLeft?: ReactNode;
};

/** Градиент и подсказка скролла — только если контент реально не помещается по высоте. */
function ProjectProductsWithScrollCue({
  stylesModule,
  children,
}: {
  stylesModule: Record<string, string>;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [showCue, setShowCue] = useState(false);

  const measure = useCallback(() => {
    const outer = scrollRef.current;
    if (!outer) return;
    setShowCue(outer.scrollHeight > Math.ceil(outer.clientHeight) + 1);
  }, []);

  useLayoutEffect(() => {
    const outer = scrollRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(inner);
    ro.observe(outer);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, children]);

  return (
    <div className={stylesModule.projectProductsWrapper}>
      <div ref={scrollRef} className={stylesModule.projectProductsScroll}>
        <div ref={innerRef} className={stylesModule.projectProductsScrollInner}>
          {children}
        </div>
      </div>
      {showCue ? (
        <>
          <div className={stylesModule.projectProductsScrollFade} aria-hidden />
          <div className={stylesModule.projectProductsScrollHint} aria-hidden>
            <svg
              className={stylesModule.projectProductsScrollHintIcon}
              width="24"
              height="24"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.25 16.5L13.75 11L8.25 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SliderCoverArrow() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="24" cy="24" r="24" fill="rgba(255,255,255,0.2)" />
      <path d="M20 24h8M24 20l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DesignerProjectsSection({ projects, stylesModule, titlesLeft }: Props) {
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [modalProject, setModalProject] = useState<ProjectData | null>(null);

  const openProjectModal = useCallback((project: ProjectData) => {
    setModalProject(project);
  }, []);

  const closeProjectModal = useCallback(() => {
    setModalProject(null);
  }, []);

  return (
    <>
      <div className={stylesModule.titlesWrapper}>
        {titlesLeft ?? <h5 className={stylesModule.titlesWrapperH5}>Проекты</h5>}
        {projects.length > 0 ? (
          <DesignerViewToggle
            styles={stylesModule}
            activeView={activeView}
            onViewChange={setActiveView}
          />
        ) : null}
      </div>

      {projects.length === 0 ? (
        <p className={stylesModule.projectsEmpty}>У дизайнера пока нет опубликованных кейсов.</p>
      ) : null}

      {activeView === 'list' && projects.length > 0 ? (
        <div className={stylesModule.projectsList}>
          {projects.map((project, index) => {
            const isReversed = index % 2 === 1;
            const secondCoverUrl = project.coverImage2?.trim() ?? '';
            const hasTwoCovers = secondCoverUrl.length > 0;
            const blockLeft = (
              <div key="left" className={stylesModule.projectBlockLeft}>
                <div className={stylesModule.projectTitlesWrapper}>
                  <div className={stylesModule.projectTitlesStack}>
                    <div className={stylesModule.projectTitlesInner}>
                      <div className={stylesModule.projectTitlesCol}>
                        <div className={stylesModule.projectTitleBlock}>
                          <h3 className={stylesModule.projectTitleName}>{project.title}</h3>
                          <span className={stylesModule.projectTitlePlaces}>{project.places}</span>
                        </div>
                        <p className={stylesModule.projectDescription}>{project.description}</p>
                        <div className={stylesModule.projectInteractWrapper}>
                          <div className={stylesModule.projectInteractItem}>
                            <img
                              src="/icons/heart.svg"
                              alt=""
                              width={20}
                              height={20}
                              className={stylesModule.projectInteractIcon}
                            />
                            <span>24</span>
                          </div>
                          <div className={stylesModule.projectInteractItem}>
                            <img
                              src="/icons/message.svg"
                              alt=""
                              width={20}
                              height={20}
                              className={stylesModule.projectInteractIcon}
                            />
                            <span>8</span>
                          </div>
                        </div>
                      </div>
                      <MoreAboutProjectModal
                        project={{
                          title: project.title,
                          places: project.places,
                          descriptionHtml: project.descriptionHtml ?? null,
                          products: project.products,
                        }}
                        linkClassName={stylesModule.moreAboutProjectLink}
                        textClassName={stylesModule.moreAboutProjectText}
                        arrowClassName={stylesModule.moreAboutProjectArrow}
                      />
                    </div>
                    {project.designer && (
                      <Link
                        href={`/designers/${project.designer.slug}`}
                        className={stylesModule.designerLinkWrapper}
                        aria-label={`Перейти к дизайнеру ${project.designer.name}`}
                      >
                        <img
                          src={project.designer.avatarSrc}
                          alt=""
                          width={43}
                          height={42}
                          className={stylesModule.designerLinkAvatar}
                        />
                        <span className={stylesModule.designerLinkName}>{project.designer.name}</span>
                        <svg
                          className={stylesModule.designerLinkArrow}
                          viewBox="0 0 22 22"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden
                        >
                          <path
                            d="M8.25 16.5L13.75 11L8.25 5.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
                <div className={stylesModule.projectImagesWrapper}>
                  {hasTwoCovers ? (
                    <>
                      <div className={stylesModule.projectThumbSlot}>
                        <img
                          src={project.coverImage}
                          alt=""
                          className={stylesModule.projectThumbImg}
                        />
                      </div>
                      <div className={stylesModule.projectThumbSlot}>
                        <img src={secondCoverUrl} alt="" className={stylesModule.projectThumbImg} />
                      </div>
                    </>
                  ) : (
                    <div
                      className={`${stylesModule.projectThumbSlot} ${stylesModule.projectThumbSlotDouble}`}
                    >
                      <img
                        src={project.coverImage}
                        alt=""
                        className={stylesModule.projectThumbImg}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
            const hasProducts = project.products.length > 0;
            const productsWrapper = hasProducts ? (
              <ProjectProductsWithScrollCue key="products" stylesModule={stylesModule}>
                {project.products.map((p) => (
                  <ProductCardSmall
                    key={p.slug}
                    slug={p.slug}
                    name={p.name}
                    price={p.price}
                    imageUrl={p.imageUrl}
                    collections={p.collections}
                    likes={p.likes}
                    comments={p.comments}
                  />
                ))}
              </ProjectProductsWithScrollCue>
            ) : (
              <div key="products" className={stylesModule.projectProductsWrapper}>
                <div className={stylesModule.projectProductsScroll}>
                  <p className={stylesModule.projectProductsScrollEmpty}>Список товаров пуст</p>
                </div>
              </div>
            );
            return (
              <div key={project.id ?? project.title} className={stylesModule.projectWrapper}>
                {isReversed ? [productsWrapper, blockLeft] : [blockLeft, productsWrapper]}
              </div>
            );
          })}
        </div>
      ) : null}

      {activeView === 'grid' && projects.length > 0 ? (
        <div className={stylesModule.sliderCoversGrid}>
          {projects.map((project) => (
            <button
              key={project.id ?? project.title}
              type="button"
              className={stylesModule.sliderCoverCard}
              onClick={() => openProjectModal(project)}
              aria-label={`О проекте: ${project.title}`}
            >
              <img
                src={project.gridCoverImage ?? project.coverImage}
                alt=""
                className={stylesModule.sliderCoverImg}
              />
              <span className={stylesModule.sliderCoverOverlay} aria-hidden />
              <span className={stylesModule.sliderCoverArrow}>
                <SliderCoverArrow />
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {modalProject && (
        <MoreAboutProjectModal
          project={{
            title: modalProject.title,
            places: modalProject.places,
            descriptionHtml: modalProject.descriptionHtml ?? null,
            products: modalProject.products,
          }}
          linkClassName={stylesModule.moreAboutProjectLink}
          textClassName={stylesModule.moreAboutProjectText}
          arrowClassName={stylesModule.moreAboutProjectArrow}
          controlledOpen
          onClose={closeProjectModal}
        />
      )}
    </>
  );
}
