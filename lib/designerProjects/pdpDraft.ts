import type { DesignerProjectLineItem } from './types';

export const PDP_PROJECT_DRAFT_SESSION_KEY = 'winwin-pdp-project-line-draft-v1';

export type PdpProjectDraftPayload = Omit<DesignerProjectLineItem, 'id' | 'roomId'> & {
  /** Задаётся при сохранении в проект */
  roomId?: string;
};

export function writePdpProjectDraft(payload: PdpProjectDraftPayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PDP_PROJECT_DRAFT_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function readPdpProjectDraft(): PdpProjectDraftPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PDP_PROJECT_DRAFT_SESSION_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== 'object') return null;
    return j as PdpProjectDraftPayload;
  } catch {
    return null;
  }
}

export function clearPdpProjectDraft(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PDP_PROJECT_DRAFT_SESSION_KEY);
}
