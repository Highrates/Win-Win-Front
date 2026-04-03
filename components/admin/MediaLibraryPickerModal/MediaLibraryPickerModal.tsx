'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { TBtn } from '@/components/TBtn/TBtn';
import {
  adminBackendJson,
  adminUploadMediaLibrary,
} from '@/lib/adminBackendFetch';
import type {
  MediaFolderRow,
  MediaLibraryTab,
  MediaObjectRow,
} from '@/lib/adminMediaLibraryTypes';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import libStyles from '@/app/(admin)/admin/objects/objectsLibrary.module.css';
import pickStyles from './MediaLibraryPickerModal.module.css';

export type MediaLibraryPickResult = { url: string; id: string };

type MediaLibraryPickerModalProps = {
  open: boolean;
  title?: string;
  /** Ограничение списка: только изображения, только видео или вся медиатека с вкладками */
  mediaFilter: 'image' | 'video' | 'all';
  onClose: () => void;
  onPick: (sel: MediaLibraryPickResult) => void;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb >= 10 ? kb.toFixed(0) : kb.toFixed(1)} kB`;
  const mb = kb / 1024;
  return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}

function formatKindLabel(mimeType: string, originalName: string): string {
  const ext = originalName.match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase();
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'application/pdf': 'PDF',
    'model/gltf-binary': 'GLB',
    'model/gltf+json': 'GLTF',
    'video/mp4': 'MP4',
    'video/webm': 'WebM',
    'video/quicktime': 'MOV',
  };
  if (map[mimeType]) return map[mimeType];
  if (ext) return ext;
  const part = mimeType.split('/')[1];
  return part ? part.replace(/[-+]/g, ' ').toUpperCase() : 'Файл';
}

function folderDepth(pathKey: string): number {
  return Math.max(0, pathKey.split('/').length - 1);
}

function sortedFolders(rows: MediaFolderRow[]): MediaFolderRow[] {
  return [...rows].sort((a, b) => a.pathKey.localeCompare(b.pathKey));
}

function tabForFilter(f: MediaLibraryPickerModalProps['mediaFilter']): MediaLibraryTab {
  if (f === 'image') return 'images';
  if (f === 'video') return 'videos';
  return 'all';
}

function selectionAllowed(
  filter: MediaLibraryPickerModalProps['mediaFilter'],
  row: MediaObjectRow,
): boolean {
  if (filter === 'image') return row.category === 'IMAGE';
  if (filter === 'video') return row.category === 'VIDEO';
  return true;
}

export function MediaLibraryPickerModal({
  open,
  title = 'Выберите объект',
  mediaFilter,
  onClose,
  onPick,
}: MediaLibraryPickerModalProps) {
  const uploadInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<MediaLibraryTab>(() => tabForFilter(mediaFilter));
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [folderFilter, setFolderFilter] = useState<string | null>(null);

  const [folders, setFolders] = useState<MediaFolderRow[]>([]);
  const [objects, setObjects] = useState<MediaObjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(() => new Set());

  const childrenByParentId = useMemo(() => {
    const m = new Map<string | null, MediaFolderRow[]>();
    for (const f of folders) {
      const k = f.parentId;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(f);
    }
    for (const arr of Array.from(m.values())) {
      arr.sort((a, b) => a.pathKey.localeCompare(b.pathKey));
    }
    return m;
  }, [folders]);

  useEffect(() => {
    if (!open) return;
    setTab(tabForFilter(mediaFilter));
    setQ('');
    setDebouncedQ('');
    setFolderFilter(null);
    setSelectedId(null);
    setError(null);
    setCollapsedFolderIds(new Set());
  }, [open, mediaFilter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadFolders = useCallback(async () => {
    try {
      const data = await adminBackendJson<MediaFolderRow[]>('catalog/admin/media/folders');
      setFolders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить папки');
    }
  }, []);

  const loadObjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.set('tab', tab);
      if (debouncedQ) sp.set('q', debouncedQ);
      if (folderFilter) sp.set('folderId', folderFilter);
      const data = await adminBackendJson<MediaObjectRow[]>(
        `catalog/admin/media/objects?${sp.toString()}`,
      );
      setObjects(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setObjects([]);
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedQ, folderFilter]);

  useEffect(() => {
    if (!open) return;
    void loadFolders();
  }, [open, loadFolders]);

  useEffect(() => {
    if (!open) return;
    void loadObjects();
  }, [open, loadObjects]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function toggleFolderCollapse(id: string) {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderFolderBranch(parentId: string | null, depth: number): ReactNode {
    const list = childrenByParentId.get(parentId) ?? [];
    return list.map((f) => {
      const isCollapsed = collapsedFolderIds.has(f.id);
      const hasKids = f._count.children > 0;
      return (
        <div key={f.id}>
          <div className={libStyles.folderRow} style={{ paddingLeft: 4 + depth * 12 }}>
            {hasKids ? (
              <button
                type="button"
                className={libStyles.folderToggle}
                aria-expanded={!isCollapsed}
                aria-label={
                  isCollapsed ? 'Развернуть вложенные папки' : 'Свернуть вложенные папки'
                }
                onClick={() => toggleFolderCollapse(f.id)}
              >
                <span
                  className={`${libStyles.folderChevron} ${isCollapsed ? libStyles.folderChevronCollapsed : ''}`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
            ) : (
              <span className={libStyles.folderToggleSpacer} aria-hidden />
            )}
            <button
              type="button"
              className={`${libStyles.folderBtn} ${folderFilter === f.id ? libStyles.folderBtnActive : ''}`}
              onClick={() => setFolderFilter(f.id)}
            >
              {f.name}
              <span className={libStyles.cardMeta}> · {f._count.objects}</span>
            </button>
          </div>
          {hasKids && !isCollapsed ? renderFolderBranch(f.id, depth + 1) : null}
        </div>
      );
    });
  }

  function renderThumb(row: MediaObjectRow) {
    if (row.category === 'IMAGE') {
      return <img className={libStyles.thumbImg} src={row.publicUrl} alt="" loading="lazy" />;
    }
    if (row.category === 'DOCUMENT') {
      return <div className={libStyles.thumbPlaceholder}>PDF / документ</div>;
    }
    if (row.category === 'MODEL') {
      return <div className={libStyles.thumbPlaceholder}>3D модель</div>;
    }
    if (row.category === 'VIDEO') {
      return <div className={libStyles.thumbPlaceholder}>Видео</div>;
    }
    return <div className={libStyles.thumbPlaceholder}>Файл</div>;
  }

  async function onPickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const row = await adminUploadMediaLibrary(file, folderFilter);
      await loadObjects();
      await loadFolders();
      if (selectionAllowed(mediaFilter, row)) {
        setSelectedId(row.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }

  function confirmSelection() {
    if (!selectedId) return;
    const row = objects.find((o) => o.id === selectedId);
    if (!row) return;
    if (!selectionAllowed(mediaFilter, row)) {
      setError(
        mediaFilter === 'image'
          ? 'Выберите изображение'
          : mediaFilter === 'video'
            ? 'Выберите видео'
            : 'Нельзя выбрать этот объект',
      );
      return;
    }
    onPick({ url: row.publicUrl, id: row.id });
  }

  const selectedRow = selectedId ? objects.find((o) => o.id === selectedId) : undefined;
  const canConfirm =
    !!selectedRow && selectionAllowed(mediaFilter, selectedRow) && !loading && !uploading;

  const tabs: { key: MediaLibraryTab; label: string }[] = [
    { key: 'all', label: 'Все объекты' },
    { key: 'images', label: 'Изображения' },
    { key: 'documents', label: 'Документы' },
    { key: 'models', label: '3D модели' },
    { key: 'videos', label: 'Видео' },
  ];

  const filterHint =
    mediaFilter === 'image'
      ? 'Изображения'
      : mediaFilter === 'video'
        ? 'Видео'
        : null;

  const uploadAccept =
    mediaFilter === 'image'
      ? 'image/jpeg,image/png,image/webp,image/gif'
      : mediaFilter === 'video'
        ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'
        : undefined;

  if (!open) return null;

  return (
    <div
      className={pickStyles.backdrop}
      role="presentation"
      onClick={() => !uploading && onClose()}
    >
      <div
        className={pickStyles.shell}
        role="dialog"
        aria-modal
        aria-labelledby="media-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={pickStyles.header}>
          <h2 id="media-picker-title" className={pickStyles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={pickStyles.closeBtn}
            aria-label="Закрыть"
            disabled={uploading}
            onClick={() => !uploading && onClose()}
          >
            ×
          </button>
        </header>

        <div className={pickStyles.body}>
          <div className={pickStyles.bodyInner}>
            <aside className={libStyles.folderSidebar} aria-label="Папки">
              <p className={libStyles.folderSidebarTitle}>Папки</p>
              <button
                type="button"
                className={`${libStyles.folderBtn} ${folderFilter === null ? libStyles.folderBtnActive : ''}`}
                onClick={() => setFolderFilter(null)}
              >
                Все расположения
              </button>
              {renderFolderBranch(null, 0)}
            </aside>

            <div className={libStyles.main}>
              <div className={catalogStyles.toolbar}>
                <input
                  type="search"
                  className={catalogStyles.search}
                  placeholder="Поиск по имени или alt…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Поиск объектов"
                />
                <input
                  ref={fileInputRef}
                  id={uploadInputId}
                  type="file"
                  accept={uploadAccept}
                  className={pickStyles.hiddenInput}
                  onChange={onPickUpload}
                />
                <TBtn
                  variant="ghost"
                  type="button"
                  className={libStyles.uploadGhost}
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src="/icons/document-download.svg" alt="" width={20} height={20} />
                  {uploading ? 'Загрузка…' : 'Загрузить в библиотеку'}
                </TBtn>
              </div>

              {filterHint ? (
                <p className={pickStyles.filterHint}>{filterHint}</p>
              ) : (
                <div className={libStyles.tabs} role="tablist" aria-label="Тип объекта">
                  {tabs.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={tab === key}
                      className={`${libStyles.tab} ${tab === key ? libStyles.tabActive : ''}`}
                      onClick={() => setTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {error ? <p className={catalogStyles.error}>{error}</p> : null}

              <div className={pickStyles.mainScroll}>
                {loading ? (
                  <p className={catalogStyles.muted}>Загрузка…</p>
                ) : objects.length === 0 ? (
                  <p className={catalogStyles.muted}>Нет объектов по текущим фильтрам.</p>
                ) : (
                  <ul className={libStyles.grid}>
                    {objects.map((row) => {
                      const allowed = selectionAllowed(mediaFilter, row);
                      const selected = row.id === selectedId;
                      return (
                        <li key={row.id} className={libStyles.objectCard}>
                          <button
                            type="button"
                            disabled={!allowed}
                            className={`${pickStyles.cardSelectable} ${libStyles.thumbWrap}`}
                            style={{
                              width: '100%',
                              border: 'none',
                              padding: 0,
                              opacity: allowed ? 1 : 0.45,
                            }}
                            aria-pressed={selected}
                            aria-label={row.originalName}
                            onClick={() => {
                              if (!allowed) return;
                              setSelectedId((cur) => (cur === row.id ? null : row.id));
                            }}
                            onDoubleClick={() => {
                              if (!allowed) return;
                              onPick({ url: row.publicUrl, id: row.id });
                            }}
                          >
                            {renderThumb(row)}
                            {selected ? (
                              <span className={pickStyles.selectedBadge} title="Выбрано" aria-hidden>
                                <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                                  <path
                                    d="M1 5.5L5 9.5L13 1"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            ) : null}
                          </button>
                          <div className={libStyles.cardBody}>
                            <p className={libStyles.cardTitle} title={row.originalName}>
                              {row.originalName}
                            </p>
                            <p className={libStyles.cardMeta}>
                              {formatKindLabel(row.mimeType, row.originalName)}
                              {row.width && row.height ? ` · ${row.width}×${row.height}` : ''}
                              {` · ${formatBytes(row.byteSize)}`}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className={pickStyles.footer}>
          <div className={pickStyles.footerActions}>
            <TBtn
              type="button"
              className={pickStyles.footerActionBtn}
              disabled={uploading}
              onClick={onClose}
            >
              Отмена
            </TBtn>
            <Button
              variant="primary"
              type="button"
              className={pickStyles.footerActionBtn}
              disabled={!canConfirm}
              onClick={() => confirmSelection()}
            >
              Выбрать
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
