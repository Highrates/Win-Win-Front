export type MediaLibraryTab = 'all' | 'images' | 'documents' | 'models' | 'videos';

export type MediaFolderRow = {
  id: string;
  name: string;
  slugSegment: string;
  parentId: string | null;
  pathKey: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: { objects: number; children: number };
};

export type MediaObjectRow = {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  category: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  folder: { id: string; name: string; pathKey: string } | null;
  publicUrl: string;
};
