import type { DesignerProjectStored } from './types';

const STORAGE_KEY = 'winwin-designer-projects-v1';

function safeParse(raw: string | null): DesignerProjectStored[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    return j.filter(isDesignerProjectStored);
  } catch {
    return [];
  }
}

function isDesignerProjectStored(v: unknown): v is DesignerProjectStored {
  if (v == null || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.address === 'string' &&
    Array.isArray(o.rooms) &&
    Array.isArray(o.lines) &&
    typeof o.updatedAt === 'string'
  );
}

export function loadDesignerProjects(): DesignerProjectStored[] {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveDesignerProjects(projects: DesignerProjectStored[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function upsertDesignerProject(project: DesignerProjectStored): void {
  const list = loadDesignerProjects();
  const i = list.findIndex((p) => p.id === project.id);
  const next = [...list];
  if (i >= 0) next[i] = project;
  else next.push(project);
  saveDesignerProjects(next);
}

export function deleteDesignerProject(id: string): void {
  saveDesignerProjects(loadDesignerProjects().filter((p) => p.id !== id));
}
