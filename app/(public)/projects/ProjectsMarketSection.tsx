'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProjectData } from '../designers/DesignerProjectsSection';
import { DesignerProjectsSection } from '../designers/DesignerProjectsSection';
import { ProjectsRoomFilter } from './ProjectsRoomFilter';

const ALL_SPACES_LABEL = 'Все пространства';

function buildRoomChips(projects: ProjectData[]): string[] {
  const s = new Set<string>();
  for (const p of projects) {
    for (const r of p.roomTypes ?? []) {
      const t = r.trim();
      if (t) s.add(t);
    }
  }
  const sorted = Array.from(s).sort((a, b) => a.localeCompare(b, 'ru'));
  return [ALL_SPACES_LABEL, ...sorted];
}

type Props = {
  projects: ProjectData[];
  stylesModule: Record<string, string>;
};

export function ProjectsMarketSection({ projects, stylesModule }: Props) {
  const roomChips = useMemo(() => buildRoomChips(projects), [projects]);
  const [activeRoom, setActiveRoom] = useState(ALL_SPACES_LABEL);

  useEffect(() => {
    if (!roomChips.includes(activeRoom)) {
      setActiveRoom(ALL_SPACES_LABEL);
    }
  }, [roomChips, activeRoom]);

  const visibleProjects = useMemo(() => {
    if (activeRoom === ALL_SPACES_LABEL) return projects;
    return projects.filter((p) =>
      (p.roomTypes ?? []).some((rt) => rt.trim() === activeRoom),
    );
  }, [projects, activeRoom]);

  return (
    <DesignerProjectsSection
      projects={visibleProjects}
      stylesModule={stylesModule}
      titlesLeft={
        <ProjectsRoomFilter
          roomChips={roomChips}
          activeLabel={activeRoom}
          onActiveChange={setActiveRoom}
        />
      }
    />
  );
}
