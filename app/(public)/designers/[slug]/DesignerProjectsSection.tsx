'use client';

import Link from 'next/link';
import { useState, useCallback, type ReactNode } from 'react';
import { ProductCardSmall } from '@/components/ProductCardSmall';
import { DesignerViewToggle, type ViewMode } from './DesignerViewToggle';
import { MoreAboutProjectModal, type ProjectProduct } from './MoreAboutProjectModal';

export type ProjectDesignerLink = {
  name: string;
  slug: string;
  avatarSrc: string;
};

export type ProjectData = {
  title: string;
  places: string;
  description: string;
  products: ProjectProduct[];
  coverImage: string;
  /** Second image for grid block (optional) */
  coverImage2?: string;
  /** Ссылка на дизайнера (страница проектов и т.п.) */
  designer?: ProjectDesignerLink;
};

type Props = {
  projects: ProjectData[];
  stylesModule: Record<string, string>;
  /** Вместо заголовка «Проекты» в строке с переключателем вида */
  titlesLeft?: ReactNode;
};

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
        <DesignerViewToggle
          styles={stylesModule}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      </div>

      {activeView === 'list' && (
        <div className={stylesModule.projectsList}>
          {projects.map((project, index) => {
            const isReversed = index % 2 === 1;
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
                          description: project.description,
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
                  <div className={stylesModule.projectThumbSlot}>
                    <img
                      src={project.coverImage}
                      alt=""
                      className={stylesModule.projectThumbImg}
                    />
                  </div>
                  <div className={stylesModule.projectThumbSlot}>
                    <img
                      src={project.coverImage2 ?? '/images/placeholder.svg'}
                      alt=""
                      className={stylesModule.projectThumbImg}
                    />
                  </div>
                </div>
              </div>
            );
            const productsWrapper = (
              <div key="products" className={stylesModule.projectProductsWrapper}>
                <div className={stylesModule.projectProductsScroll}>
                  {project.products.map((p) => (
                    <ProductCardSmall
                      key={p.slug}
                      slug={p.slug}
                      name={p.name}
                      price={p.price}
                      collections={p.collections}
                      likes={p.likes}
                      comments={p.comments}
                    />
                  ))}
                </div>
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
              </div>
            );
            return (
              <div key={project.title} className={stylesModule.projectWrapper}>
                {isReversed ? [productsWrapper, blockLeft] : [blockLeft, productsWrapper]}
              </div>
            );
          })}
        </div>
      )}

      {activeView === 'grid' && (
        <div className={stylesModule.sliderCoversGrid}>
          {projects.map((project) => (
            <button
              key={project.title}
              type="button"
              className={stylesModule.sliderCoverCard}
              onClick={() => openProjectModal(project)}
              aria-label={`О проекте: ${project.title}`}
            >
              <img
                src={project.coverImage}
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
      )}

      {modalProject && (
        <MoreAboutProjectModal
          project={{
            title: modalProject.title,
            places: modalProject.places,
            description: modalProject.description,
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
