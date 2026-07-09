import type { MediaFolderRow } from '@/lib/adminMediaLibraryTypes';

export function folderPathLabel(pathKey: string): string {
  return pathKey.replace(/\//g, ' / ');
}

export function folderMatchesQuery(f: MediaFolderRow, query: string): boolean {
  const q = query.toLowerCase();
  return f.name.toLowerCase().includes(q) || f.pathKey.toLowerCase().includes(q);
}

export function sortedMediaFolders(rows: MediaFolderRow[]): MediaFolderRow[] {
  return [...rows].sort((a, b) => a.pathKey.localeCompare(b.pathKey));
}

export function collectFolderAncestorIds(
  folderId: string,
  foldersById: Map<string, MediaFolderRow>,
): string[] {
  const ancestorIds: string[] = [];
  let parentId = foldersById.get(folderId)?.parentId ?? null;
  while (parentId) {
    ancestorIds.push(parentId);
    parentId = foldersById.get(parentId)?.parentId ?? null;
  }
  return ancestorIds;
}
