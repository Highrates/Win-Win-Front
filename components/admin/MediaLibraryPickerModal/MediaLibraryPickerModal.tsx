'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import compactStyles from '@/components/AdminCompactBtn/AdminCompactBtn.module.css';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import {
  adminBackendJson,
  adminUploadMediaLibrary,
} from '@/lib/adminBackendFetch';
import { adminBackendList, adminListParams } from '@/lib/adminListResponse';
import { isHeavyMediaObject } from '@/lib/adminMediaLibrary/heavyMedia';
import {
  readCollapsedFolderIds,
  writeCollapsedFolderIds,
} from '@/lib/adminMediaLibrary/folderTreeCollapseStorage';
import type {
  MediaFolderRow,
  MediaLibraryScope,
  MediaLibraryTab,
  MediaObjectRow,
} from '@/lib/adminMediaLibraryTypes';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import libStyles from '@/app/(admin)/admin/objects/objectsLibrary.module.css';
import pickStyles from './MediaLibraryPickerModal.module.css';

export type MediaLibraryPickResult = {
  url: string;
  id: string;
  /** Исходное имя файла в медиатеке (без папок и без расширения). */
  originalName?: string;
};

type MediaLibraryPickerModalProps = {
  open: boolean;
  title?: string;
  /** Ограничение списка: только изображения, только видео или вся медиатека с вкладками */
  mediaFilter: 'image' | 'video' | 'all';
  onClose: () => void;
  /** Один медиафайл (кнопка «Выбрать» или двойной клик по карточке) */
  onPick?: (sel: MediaLibraryPickResult) => void;
  /** Несколько медиафайлов: выбор кадров в сетке и «Добавить выбранные» */
  onPickBatch?: (items: MediaLibraryPickResult[]) => void;
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

import {
  collectFolderAncestorIds,
  folderMatchesQuery,
  folderPathLabel,
  sortedMediaFolders,
} from '@/lib/adminMediaLibrary/folderSearch';

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

const PICKER_LIBRARY_SCOPE: MediaLibraryScope = 'winwin';
const PICKER_OBJECTS_LIMIT = 40;

export function MediaLibraryPickerModal({
  open,
  title = 'Выберите медиафайл',
  mediaFilter,
  onClose,
  onPick,
  onPickBatch,
}: MediaLibraryPickerModalProps) {
  const uploadInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const multiMode = typeof onPickBatch === 'function';

  const [tab, setTab] = useState<MediaLibraryTab>(() => tabForFilter(mediaFilter));
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [folderQ, setFolderQ] = useState('');
  const folderSearchQuery = folderQ.trim();

  const [folders, setFolders] = useState<MediaFolderRow[]>([]);
  const [objects, setObjects] = useState<MediaObjectRow[]>([]);
  const [objectsPage, setObjectsPage] = useState(1);
  const [objectsTotal, setObjectsTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Режим `onPickBatch`: выбранные карточки (сохраняются между страницами) */
  const [selectedById, setSelectedById] = useState<Map<string, MediaLibraryPickResult>>(() => new Map());

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

  const folderIdsWithChildren = useMemo(
    () => new Set(folders.filter((f) => f._count.children > 0).map((f) => f.id)),
    [folders],
  );

  const folderSearchActive = folderSearchQuery.length > 0;

  const folderSearchResults = useMemo(() => {
    if (!folderSearchActive) return [];
    return sortedMediaFolders(folders.filter((f) => folderMatchesQuery(f, folderSearchQuery)));
  }, [folders, folderSearchActive, folderSearchQuery]);

  const foldersById = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

  const allFoldersCollapsed = useMemo(() => {
    if (folderIdsWithChildren.size === 0) return false;
    return Array.from(folderIdsWithChildren).every((id) => collapsedFolderIds.has(id));
  }, [collapsedFolderIds, folderIdsWithChildren]);

  function persistCollapsedFolderIds(next: Set<string>) {
    writeCollapsedFolderIds(PICKER_LIBRARY_SCOPE, next);
  }

  function toggleCollapseAllFolders() {
    if (folderIdsWithChildren.size === 0) return;
    const next = allFoldersCollapsed
      ? new Set<string>()
      : new Set(folderIdsWithChildren);
    setCollapsedFolderIds(next);
    persistCollapsedFolderIds(next);
  }

  useEffect(() => {
    if (!open) return;
    setTab(tabForFilter(mediaFilter));
    setQ('');
    setDebouncedQ('');
    setFolderFilter(null);
    setFolderQ('');
    setObjectsPage(1);
    setSelectedId(null);
    setSelectedById(new Map());
    setError(null);
    setCollapsedFolderIds(readCollapsedFolderIds(PICKER_LIBRARY_SCOPE));
  }, [open, mediaFilter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setObjectsPage(1);
  }, [debouncedQ, tab, folderFilter]);

  const loadFolders = useCallback(async () => {
    try {
      const data = await adminBackendJson<MediaFolderRow[]>(
        'catalog/admin/media/folders?scope=winwin',
      );
      setFolders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить папки');
    }
  }, []);

  const loadObjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = adminListParams({ page: objectsPage, limit: PICKER_OBJECTS_LIMIT, q: debouncedQ });
      sp.set('tab', tab);
      sp.set('scope', 'winwin');
      if (folderFilter) sp.set('folderId', folderFilter);
      const data = await adminBackendList<MediaObjectRow>('catalog/admin/media/objects', sp);
      setObjects(data.items);
      setObjectsTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setObjects([]);
      setObjectsTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedQ, folderFilter, objectsPage]);

  useEffect(() => {
    if (!open) return;
    void loadFolders();
  }, [open, loadFolders]);

  useEffect(() => {
    if (!open) return;
    void loadObjects();
  }, [open, loadObjects]);

  useEffect(() => {
    if (!open || folders.length === 0) return;
    setCollapsedFolderIds((prev) => {
      const folderIdSet = new Set(folders.map((f) => f.id));
      const next = new Set(Array.from(prev).filter((id) => folderIdSet.has(id)));
      if (next.size === prev.size) return prev;
      writeCollapsedFolderIds(PICKER_LIBRARY_SCOPE, next);
      return next;
    });
  }, [folders, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function toggleFolderCollapse(id: string) {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistCollapsedFolderIds(next);
      return next;
    });
  }

  function selectFolder(id: string) {
    setFolderFilter(id);
    const ancestorIds = collectFolderAncestorIds(id, foldersById);
    if (ancestorIds.length === 0) return;
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      for (const aid of ancestorIds) next.delete(aid);
      persistCollapsedFolderIds(next);
      return next;
    });
  }

  function selectFolderFromSearch(id: string) {
    selectFolder(id);
    setFolderQ('');
  }

  function renderFolderSearchResults(): ReactNode {
    if (folderSearchResults.length === 0) {
      return <p className={libStyles.folderSearchEmpty}>Папки не найдены</p>;
    }
    return folderSearchResults.map((f) => (
      <button
        key={f.id}
        type="button"
        className={`${libStyles.folderSearchBtn} ${folderFilter === f.id ? libStyles.folderBtnActive : ''}`}
        onClick={() => selectFolderFromSearch(f.id)}
        title={f.pathKey}
      >
        <span className={libStyles.folderSearchName}>{f.name}</span>
        {f.pathKey !== f.name ? (
          <span className={libStyles.folderSearchPath}>{folderPathLabel(f.pathKey)}</span>
        ) : null}
      </button>
    ));
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
              onClick={() => selectFolder(f.id)}
            >
              {f.name}
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
    const list = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!list.length) return;
    setUploading(true);
    setError(null);
    const errors: string[] = [];
    let lastOk: MediaObjectRow | null = null;
    try {
      for (const file of list) {
        try {
          const row = await adminUploadMediaLibrary(file, folderFilter);
          lastOk = row;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
          errors.push(`${file.name}: ${msg}`);
        }
      }
      if (errors.length) {
        setError(
          errors.length === list.length
            ? errors.join('\n')
            : `Не удалось загрузить ${errors.length} из ${list.length}:\n${errors.join('\n')}`,
        );
      }
      if (errors.length < list.length) {
        await loadObjects();
        await loadFolders();
        if (lastOk && selectionAllowed(mediaFilter, lastOk)) {
          const pick = {
            url: lastOk.publicUrl,
            id: lastOk.id,
            originalName: lastOk.originalName,
          };
          if (multiMode) {
            setSelectedById((prev) => {
              const next = new Map(prev);
              next.set(lastOk!.id, pick);
              return next;
            });
          } else {
            setSelectedId(lastOk.id);
          }
        }
      }
    } finally {
      setUploading(false);
    }
  }

  function confirmSelection() {
    if (!onPick) return;
    if (!selectedId) return;
    const row = objects.find((o) => o.id === selectedId);
    if (!row) return;
    if (!selectionAllowed(mediaFilter, row)) {
      setError(
        mediaFilter === 'image'
          ? 'Выберите изображение'
          : mediaFilter === 'video'
            ? 'Выберите видео'
            : 'Нельзя выбрать этот медиафайл',
      );
      return;
    }
    onPick({ url: row.publicUrl, id: row.id, originalName: row.originalName });
  }

  function confirmBatch() {
    if (!onPickBatch) return;
    const rows = Array.from(selectedById.values());
    if (!rows.length) return;
    onPickBatch(rows);
  }

  function toggleCardSelection(row: MediaObjectRow) {
    if (!selectionAllowed(mediaFilter, row)) return;
    setSelectedById((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id);
      else {
        next.set(row.id, {
          url: row.publicUrl,
          id: row.id,
          originalName: row.originalName,
        });
      }
      return next;
    });
  }

  const selectedRow = selectedId ? objects.find((o) => o.id === selectedId) : undefined;
  const canConfirm =
    !multiMode &&
    !!onPick &&
    !!selectedRow &&
    selectionAllowed(mediaFilter, selectedRow) &&
    !loading &&
    !uploading;
  const batchCount = selectedById.size;
  const canConfirmBatch =
    multiMode && batchCount > 0 && !loading && !uploading;

  const tabs: { key: MediaLibraryTab; label: string }[] = [
    { key: 'all', label: 'Все медиафайлы' },
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

  if (!onPick && !onPickBatch) {
    return null;
  }

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
          <h2 id="media-picker-title" className={pickStyles.modalTitle}>
            {title}
          </h2>
          <AdminModalCloseButton
            label="Закрыть"
            disabled={uploading}
            onClick={() => !uploading && onClose()}
          />
        </header>

        <div className={pickStyles.body}>
          <div className={pickStyles.bodyInner}>
            <aside
              className={`${libStyles.folderSidebar} ${pickStyles.pickerFolderColumn}`}
              aria-label="Папки"
            >
              <div className={libStyles.folderSidebarTitleRow}>
                <p className={libStyles.folderSidebarTitle}>Папки</p>
                {!folderSearchActive && folderIdsWithChildren.size > 0 ? (
                  <button
                    type="button"
                    className={libStyles.folderCollapseAllBtn}
                    onClick={toggleCollapseAllFolders}
                    aria-label={
                      allFoldersCollapsed ? 'Развернуть все папки' : 'Свернуть все папки'
                    }
                    title={
                      allFoldersCollapsed ? 'Развернуть все папки' : 'Свернуть все папки'
                    }
                  >
                    <span
                      className={`${libStyles.folderCollapseAllChevron} ${allFoldersCollapsed ? libStyles.folderCollapseAllChevronCollapsed : ''}`}
                      aria-hidden
                    >
                      ▼
                    </span>
                  </button>
                ) : null}
              </div>
              <AdminSearchBox
                className={libStyles.folderSearchBox}
                placeholder="Поиск папки…"
                ariaLabel="Поиск папок"
                value={folderQ}
                onChange={(e) => setFolderQ(e.target.value)}
              />
              {!folderSearchActive ? (
                <>
                  <button
                    type="button"
                    className={`${libStyles.folderBtn} ${folderFilter === null ? libStyles.folderBtnActive : ''}`}
                    onClick={() => setFolderFilter(null)}
                  >
                    Все расположения
                  </button>
                  {renderFolderBranch(null, 0)}
                </>
              ) : (
                <div className={libStyles.folderSearchResults}>{renderFolderSearchResults()}</div>
              )}
            </aside>

            <div className={`${libStyles.main} ${pickStyles.pickerMainColumn}`}>
              <div className={catalogStyles.toolbar}>
                <AdminSearchBox
                  className={catalogStyles.searchBoxToolbar}
                  placeholder="Поиск по имени или alt…"
                  ariaLabel="Поиск медиафайлов"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <div
                  className={`${libStyles.uploadWrap} ${uploading ? libStyles.uploadLabelDisabled : ''}`}
                >
                  <span
                    className={`${compactStyles.btn} ${compactStyles.btnNeutral} ${libStyles.uploadFace}`}
                    aria-hidden
                  >
                    <img
                      src="/icons/document-download.svg"
                      alt=""
                      width={14}
                      height={14}
                      className={libStyles.uploadIcon}
                    />
                    {uploading ? 'Загрузка…' : 'Загрузить'}
                  </span>
                  <input
                    ref={fileInputRef}
                    id={uploadInputId}
                    type="file"
                    multiple
                    accept={uploadAccept}
                    className={libStyles.fileInputOverlay}
                    disabled={uploading}
                    onChange={onPickUpload}
                    aria-label="Загрузить в библиотеку"
                    title="Загрузить в библиотеку"
                  />
                </div>
              </div>

              {filterHint ? (
                <p className={pickStyles.filterHint}>{filterHint}</p>
              ) : (
                <div className={pickStyles.tabsSpacer}>
                  <AdminTabs
                    variant="pill"
                    ariaLabel="Тип медиафайла"
                    items={tabs.map(({ key, label }) => ({ id: key, label }))}
                    activeId={tab}
                    onChange={setTab}
                  />
                </div>
              )}

              {error ? <p className={catalogStyles.error}>{error}</p> : null}

              <div className={pickStyles.mainScroll}>
                {loading ? (
                  <p className={catalogStyles.muted}>Загрузка…</p>
                ) : objects.length === 0 ? (
                  <p className={catalogStyles.muted}>Нет медиафайлов по текущим фильтрам.</p>
                ) : (
                  <ul className={libStyles.grid}>
                    {objects.map((row) => {
                      const allowed = selectionAllowed(mediaFilter, row);
                      const selected = multiMode
                        ? selectedById.has(row.id)
                        : row.id === selectedId;
                      return (
                        <li
                          key={row.id}
                          className={`${libStyles.objectCard} ${isHeavyMediaObject(row) ? libStyles.objectCardHeavy : ''}`.trim()}
                        >
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
                              if (multiMode) {
                                toggleCardSelection(row);
                              } else {
                                setSelectedId((cur) => (cur === row.id ? null : row.id));
                              }
                            }}
                            onDoubleClick={() => {
                              if (!allowed) return;
                              if (multiMode) {
                                toggleCardSelection(row);
                              } else if (onPick) {
                                onPick({
                                  url: row.publicUrl,
                                  id: row.id,
                                  originalName: row.originalName,
                                });
                              }
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
                <AdminListPagination
                  page={objectsPage}
                  total={objectsTotal}
                  limit={PICKER_OBJECTS_LIMIT}
                  onPageChange={setObjectsPage}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        <footer className={pickStyles.footer}>
          <div className={pickStyles.footerActions}>
            <AdminCompactBtn
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={onClose}
            >
              Отмена
            </AdminCompactBtn>
            {multiMode ? (
              <AdminCompactBtn
                type="button"
                disabled={!canConfirmBatch}
                onClick={() => confirmBatch()}
              >
                {batchCount > 0 ? `Добавить (${batchCount})` : 'Добавить'}
              </AdminCompactBtn>
            ) : (
              <AdminCompactBtn
                type="button"
                disabled={!canConfirm}
                onClick={() => confirmSelection()}
              >
                Выбрать
              </AdminCompactBtn>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
