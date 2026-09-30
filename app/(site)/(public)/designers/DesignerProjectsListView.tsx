'use client';

import Link from 'next/link';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ProductCardSmall } from '@/components/ProductCardSmall';
import { CaseAudienceSocial } from '@/components/CaseAudienceSocial/CaseAudienceSocial';
import { LikeHeartSvg } from '@/components/LikeHeartSvg/LikeHeartSvg';
import type { LikesBulkUiState } from '@/lib/likesBulkUi';
import { MoreAboutProjectModal } from './[slug]/MoreAboutProjectModal';
import type { ProjectData } from './designerProjectsTypes';

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

type Props = {
  projects: ProjectData[];
  stylesModule: Record<string, string>;
  caseBulkUi: (caseId: string | undefined) => LikesBulkUiState | undefined;
  productBulkUi: (productId: string | undefined) => LikesBulkUiState | undefined;
};

export function DesignerProjectsListView({
  projects,
  stylesModule,
  caseBulkUi,
  productBulkUi,
}: Props) {
  return (
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
                      {project.id ? (
                        <CaseAudienceSocial
                          caseId={project.id}
                          likesDisplayCount={project.likesDisplayCount}
                          caseLikesBulk={caseBulkUi(project.id)}
                          classNames={{
                            interactItem: stylesModule.projectInteractItem,
                            interactIcon: stylesModule.projectInteractIcon,
                            interactValue: stylesModule.projectInteractValue,
                            heartActive: stylesModule.projectHeartActive,
                          }}
                        />
                      ) : (
                        <>
                          <div className={stylesModule.projectInteractItem}>
                            <LikeHeartSvg className={stylesModule.projectInteractIcon} />
                            <span className={stylesModule.projectInteractValue}>
                              {project.likesDisplayCount ?? 0}
                            </span>
                          </div>
                          <div className={stylesModule.projectInteractItem}>
                            <img
                              src="/icons/message.svg"
                              alt=""
                              width={20}
                              height={20}
                              className={stylesModule.projectInteractIcon}
                            />
                            <span className={stylesModule.projectInteractValue}>0</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <MoreAboutProjectModal
                    project={{
                      title: project.title,
                      places: project.places,
                      descriptionHtml: project.descriptionHtml ?? null,
                      products: project.products,
                      coverImages: [
                        project.coverImage,
                        ...(project.coverImage2?.trim() ? [project.coverImage2.trim()] : []),
                      ],
                    }}
                    linkClassName={stylesModule.moreAboutProjectLink}
                    textClassName={stylesModule.moreAboutProjectText}
                    arrowClassName={stylesModule.moreAboutProjectArrow}
                    productLikesBulkFor={productBulkUi}
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
                {!project.designer && project.brand && (
                  <Link
                    href={`/brands/${project.brand.slug}`}
                    className={stylesModule.designerLinkWrapper}
                    aria-label={`Перейти к бренду ${project.brand.name}`}
                  >
                    <img
                      src={project.brand.avatarSrc}
                      alt=""
                      width={43}
                      height={42}
                      className={stylesModule.designerLinkAvatar}
                    />
                    <span className={stylesModule.designerLinkName}>{project.brand.name}</span>
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
                    <img src={project.coverImage} alt={project.title} className={stylesModule.projectThumbImg} />
                  </div>
                  <div className={stylesModule.projectThumbSlot}>
                    <img src={secondCoverUrl} alt={project.title} className={stylesModule.projectThumbImg} />
                  </div>
                </>
              ) : (
                <div className={`${stylesModule.projectThumbSlot} ${stylesModule.projectThumbSlotDouble}`}>
                  <img src={project.coverImage} alt={project.title} className={stylesModule.projectThumbImg} />
                </div>
              )}
            </div>
          </div>
        );
        const hasProductsRow = project.products.length > 0;
        const productsWrapper = hasProductsRow ? (
          <ProjectProductsWithScrollCue key="products" stylesModule={stylesModule}>
            {project.products.map((p) => (
              <ProductCardSmall
                key={p.productId ?? p.slug}
                slug={p.slug}
                name={p.name}
                price={p.price}
                imageUrl={p.imageUrl}
                productId={p.productId}
                collections={p.collections}
                likes={p.likes}
                qaMessageCount={p.qaMessageCount}
                productLikesBulk={productBulkUi(p.productId)}
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
  );
}
