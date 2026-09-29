'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import type { LikesBulkUiState } from '@/lib/likesBulkUi';
import { CaseCoverLikeButton } from './CaseCoverLikeButton';
import { GRID_CARD_ASPECTS, type ProjectData } from './designerProjectsTypes';

function SliderCoverArrow() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M16.5 20h7M20 16.5l3.5 3.5-3.5 3.5"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  projects: ProjectData[];
  stylesModule: Record<string, string>;
  caseBulkUi: (caseId: string | undefined) => LikesBulkUiState | undefined;
  onOpenProject: (project: ProjectData) => void;
  ariaBusy?: boolean;
};

export function DesignerProjectsMasonryGrid({
  projects,
  stylesModule,
  caseBulkUi,
  onOpenProject,
  ariaBusy = false,
}: Props) {
  const [masonryCols, setMasonryCols] = useState(4);

  useLayoutEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w <= 768) setMasonryCols(2);
      else if (w <= 1100) setMasonryCols(3);
      else setMasonryCols(4);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const gridColumns = useMemo(() => {
    // Всегда полный набор колонок — иначе 1 кейс растягивается на всю ширину.
    const colCount = Math.max(1, masonryCols);
    const cols: { project: ProjectData; index: number }[][] = Array.from({ length: colCount }, () => []);
    projects.forEach((project, index) => {
      cols[index % colCount].push({ project, index });
    });
    return cols;
  }, [projects, masonryCols]);

  return (
    <div className={stylesModule.sliderCoversGrid} aria-busy={ariaBusy || undefined}>
      {gridColumns.map((column, colIdx) => (
        <div
          key={colIdx}
          className={stylesModule.sliderCoversColumn ?? undefined}
          style={
            stylesModule.sliderCoversColumn
              ? undefined
              : { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }
          }
        >
          {column.map(({ project, index }) => (
            <div
              key={project.id ?? project.title}
              className={stylesModule.sliderCoverCard}
              style={{ aspectRatio: GRID_CARD_ASPECTS[index % GRID_CARD_ASPECTS.length] }}
            >
              <img
                src={project.gridCoverImage ?? project.coverImage}
                alt={project.title}
                className={stylesModule.sliderCoverImg}
              />
              {project.id ? (
                <CaseCoverLikeButton
                  caseId={project.id}
                  likesDisplayCount={project.likesDisplayCount}
                  caseLikesBulk={caseBulkUi(project.id)}
                  classNames={{
                    btn: stylesModule.sliderCoverLikeBtn,
                    icon: stylesModule.sliderCoverLikeIcon,
                    iconActive: stylesModule.sliderCoverLikeIconActive,
                    value: stylesModule.sliderCoverLikeValue,
                  }}
                />
              ) : null}
              <span className={stylesModule.sliderCoverOverlay} aria-hidden />
              <span className={stylesModule.sliderCoverArrow}>
                <SliderCoverArrow />
              </span>
              <button
                type="button"
                className={stylesModule.sliderCoverOpenBtn}
                onClick={() => onOpenProject(project)}
                aria-label={`О проекте: ${project.title}`}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
