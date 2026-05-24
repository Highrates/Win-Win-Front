import type { MediaLibraryScope } from '@/lib/adminMediaLibraryTypes';

const STORAGE_KEY_PREFIX = 'winwin-admin-objects-folder-collapse-v1';

function storageKey(scope: MediaLibraryScope): string {
  return `${STORAGE_KEY_PREFIX}-${scope}`;
}

function safeParse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

export function readCollapsedFolderIds(scope: MediaLibraryScope): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(safeParse(window.localStorage.getItem(storageKey(scope))));
  } catch {
    return new Set();
  }
}

export function writeCollapsedFolderIds(
  scope: MediaLibraryScope,
  collapsedFolderIds: Set<string>,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      storageKey(scope),
      JSON.stringify(Array.from(collapsedFolderIds)),
    );
  } catch {
    // ignore quota / private mode
  }
}
