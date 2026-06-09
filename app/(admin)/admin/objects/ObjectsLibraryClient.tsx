'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import compactStyles from '@/components/AdminCompactBtn/AdminCompactBtn.module.css';
import { AdminTextField, AdminSelect } from '@/components/AdminTextField/AdminTextField';
import { AdminModalCloseButton } from '@/components/admin/AdminModalCloseButton/AdminModalCloseButton';
import modalStyles from '@/components/admin/AdminModal/AdminModal.module.css';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { AdminSearchBox } from '@/components/SearchBox/SearchBox';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import {
  adminBackendJson,
  adminUploadMediaLibrary,
} from '@/lib/adminBackendFetch';
import { adminBackendList, adminListParams } from '@/lib/adminListResponse';
import {
  adminQueryErrorMessage,
  adminQueryInitialLoading,
  adminQueryKeys,
  useAdminQuery,
  useDebouncedValue,
  useInvalidateAdminQueries,
} from '@/lib/adminQuery';
import { AdminListPagination } from '@/components/admin/AdminListPagination/AdminListPagination';
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
import { objectsLibraryStrings } from '@/lib/admin-i18n/adminObjectsLibraryStrings';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import styles from './objectsLibrary.module.css';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb >= 10 ? kb.toFixed(0) : kb.toFixed(1)} kB`;
  const mb = kb / 1024;
  return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}

function formatKindLabel(mimeType: string, originalName: string, fallbackGeneric: string): string {
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
  return part ? part.replace(/[-+]/g, ' ').toUpperCase() : fallbackGeneric;
}

/** Отступ подписей в селектах (плоский список по pathKey) */
function folderDepth(pathKey: string): number {
  return Math.max(0, pathKey.split('/').length - 1);
}

function sortedFolders(rows: MediaFolderRow[]): MediaFolderRow[] {
  return [...rows].sort((a, b) => a.pathKey.localeCompare(b.pathKey));
}

const PROTECTED_FOLDER_PATH_PREFIX = 'category-backgrounds';
const USER_PROFILES_ROOT_PATH_KEY = 'user-profiles';

function isProtectedMediaFolder(f: MediaFolderRow): boolean {
  if (f.pathKey === USER_PROFILES_ROOT_PATH_KEY) {
    return true;
  }
  return (
    f.pathKey === PROTECTED_FOLDER_PATH_PREFIX ||
    f.pathKey.startsWith(`${PROTECTED_FOLDER_PATH_PREFIX}/`)
  );
}

function folderParentDisplayName(
  f: MediaFolderRow,
  all: MediaFolderRow[],
  rootLabel: string
): string {
  if (!f.parentId) return rootLabel;
  return all.find((x) => x.id === f.parentId)?.name ?? '—';
}

type ObjectsLibraryClientProps = {
  /** Текст под заголовком страницы (например ссылка на сжатие). */
  lead?: ReactNode;
};

type UploadBatchItem = {
  previewUrl: string | null;
  fileName: string;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'cancelled';
  error?: string;
};

function isUploadAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export function ObjectsLibraryClient({ lead }: ObjectsLibraryClientProps) {
  const uploadInputId = useId();
  const { locale } = useAdminLocale();
  const s = useMemo(() => objectsLibraryStrings(locale), [locale]);
  const invalidate = useInvalidateAdminQueries();
  const { confirm } = useAdminConfirm();

  const [libraryScope, setLibraryScope] = useState<MediaLibraryScope>('winwin');
  const [tab, setTab] = useState<MediaLibraryTab>('all');
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q.trim());
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [objectsPage, setObjectsPage] = useState(1);

  const [uploadBatch, setUploadBatch] = useState<UploadBatchItem[] | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const uploadCancelledRef = useRef(false);
  const uploading = uploadBatch !== null;
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createParentId, setCreateParentId] = useState('');
  const [createSaving, setCreateSaving] = useState(false);

  const [folderSettings, setFolderSettings] = useState<MediaFolderRow | null>(null);
  const [folderDeleting, setFolderDeleting] = useState(false);

  const [detail, setDetail] = useState<MediaObjectRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOriginalName, setDetailOriginalName] = useState('');
  const [detailAlt, setDetailAlt] = useState('');
  const [detailFolderId, setDetailFolderId] = useState<string>('');
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailDeleting, setDetailDeleting] = useState(false);

  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(() => new Set());

  const { data: folders = [], error: foldersQueryError } = useAdminQuery(
    adminQueryKeys.mediaFolders.list(libraryScope),
    () =>
      adminBackendJson<MediaFolderRow[]>(`catalog/admin/media/folders?scope=${libraryScope}`),
  );

  const objectsListParams = useMemo(
    () => ({
      q: debouncedQ,
      page: objectsPage,
      tab,
      folderId: folderFilter,
      scope: libraryScope,
    }),
    [debouncedQ, objectsPage, tab, folderFilter, libraryScope],
  );

  const {
    data: objectsData,
    isLoading: objectsLoading,
    isFetching: objectsFetching,
    error: objectsQueryError,
  } = useAdminQuery(
    adminQueryKeys.mediaObjects.list(objectsListParams),
    () => {
      const sp = adminListParams({ page: objectsPage, limit: 40, q: debouncedQ });
      sp.set('tab', tab);
      sp.set('scope', libraryScope);
      if (folderFilter) sp.set('folderId', folderFilter);
      return adminBackendList<MediaObjectRow>('catalog/admin/media/objects', sp);
    },
  );

  const objects = objectsData?.items ?? [];
  const objectsTotal = objectsData?.total ?? 0;
  const objectsLimit = objectsData?.limit ?? 40;
  const loading = adminQueryInitialLoading(objectsLoading, objectsData);
  const error =
    mutationError ??
    (foldersQueryError ? adminQueryErrorMessage(foldersQueryError, s.errLoadFolders) : null) ??
    (objectsQueryError ? adminQueryErrorMessage(objectsQueryError, s.errLoadObjects) : null);

  async function refreshMediaLibrary() {
    await invalidate(adminQueryKeys.mediaFolders.all);
    await invalidate(adminQueryKeys.mediaObjects.all);
  }

  function dismissUploadBatch(delayMs: number) {
    window.setTimeout(() => {
      setUploadBatch((prev) => {
        prev?.forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        return null;
      });
      uploadAbortRef.current = null;
      uploadCancelledRef.current = false;
    }, delayMs);
  }

  function cancelUploadBatch() {
    uploadCancelledRef.current = true;
    uploadAbortRef.current?.abort();
    setUploadBatch(
      (prev) =>
        prev?.map((item) =>
          item.status === 'pending' || item.status === 'uploading'
            ? { ...item, status: 'cancelled' as const }
            : item,
        ) ?? null,
    );
  }

  const userProfilesRootId = useMemo(
    () => folders.find((f) => f.pathKey === USER_PROFILES_ROOT_PATH_KEY)?.id,
    [folders],
  );

  const childrenByParentId = useMemo(() => {
    const m = new Map<string | null, MediaFolderRow[]>();
    for (const f of folders) {
      const k = f.parentId;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(f);
    }
    for (const arr of Array.from(m.values())) {
      arr.sort((a: MediaFolderRow, b: MediaFolderRow) =>
        a.pathKey.localeCompare(b.pathKey)
      );
    }
    return m;
  }, [folders]);

  const folderIdsWithChildren = useMemo(
    () => new Set(folders.filter((f) => f._count.children > 0).map((f) => f.id)),
    [folders],
  );

  const allFoldersCollapsed = useMemo(() => {
    if (folderIdsWithChildren.size === 0) return false;
    return Array.from(folderIdsWithChildren).every((id) => collapsedFolderIds.has(id));
  }, [collapsedFolderIds, folderIdsWithChildren]);

  function persistCollapsedFolderIds(next: Set<string>) {
    writeCollapsedFolderIds(libraryScope, next);
  }

  function toggleCollapseAllFolders() {
    if (folderIdsWithChildren.size === 0) return;
    const next = allFoldersCollapsed
      ? new Set<string>()
      : new Set(folderIdsWithChildren);
    setCollapsedFolderIds(next);
    persistCollapsedFolderIds(next);
  }

  function toggleFolderCollapse(id: string) {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistCollapsedFolderIds(next);
      return next;
    });
  }

  function renderFolderBranch(parentId: string | null, depth: number): React.ReactNode {
    const list = childrenByParentId.get(parentId) ?? [];
    return list.map((f) => {
      const isCollapsed = collapsedFolderIds.has(f.id);
      const hasKids = f._count.children > 0;
      return (
        <div key={f.id}>
          <div className={styles.folderRow} style={{ paddingLeft: 4 + depth * 12 }}>
            {hasKids ? (
              <button
                type="button"
                className={styles.folderToggle}
                aria-expanded={!isCollapsed}
                aria-label={
                  isCollapsed ? s.folderExpandNested : s.folderCollapseNested
                }
                onClick={() => toggleFolderCollapse(f.id)}
              >
                <span
                  className={`${styles.folderChevron} ${isCollapsed ? styles.folderChevronCollapsed : ''}`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
            ) : (
              <span className={styles.folderToggleSpacer} aria-hidden />
            )}
            <div className={styles.folderRowMain}>
              <button
                type="button"
                className={`${styles.folderBtn} ${folderFilter === f.id ? styles.folderBtnActive : ''}`}
                onClick={() => setFolderFilter(f.id)}
                title={f.name}
              >
                {f.name}
              </button>
              <button
                type="button"
                className={styles.folderMenuBtn}
                title={s.folderSettingsTitle}
                aria-label={s.folderSettingsAria}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFolderSettings(f);
                }}
              >
                ⋮
              </button>
            </div>
          </div>
          {hasKids && !isCollapsed ? renderFolderBranch(f.id, depth + 1) : null}
        </div>
      );
    });
  }

  useEffect(() => {
    setFolderFilter(null);
    setObjectsPage(1);
    setCollapsedFolderIds(readCollapsedFolderIds(libraryScope));
  }, [libraryScope]);

  useEffect(() => {
    setObjectsPage(1);
  }, [debouncedQ, tab, folderFilter]);

  useEffect(() => {
    if (folders.length === 0) return;
    setCollapsedFolderIds((prev) => {
      const folderIdSet = new Set(folders.map((f) => f.id));
      const next = new Set(Array.from(prev).filter((id) => folderIdSet.has(id)));
      if (next.size === prev.size) return prev;
      writeCollapsedFolderIds(libraryScope, next);
      return next;
    });
  }, [folders, libraryScope]);

  function openCreateFolder() {
    setCreateName('');
    if (libraryScope === 'user' && userProfilesRootId) {
      setCreateParentId(folderFilter ?? userProfilesRootId);
    } else {
      setCreateParentId(folderFilter ?? '');
    }
    setCreateOpen(true);
  }

  async function submitCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    const name = createName.trim();
    if (!name) return;
    setCreateSaving(true);
    setMutationError(null);
    try {
      await adminBackendJson<MediaFolderRow>('catalog/admin/media/folders', {
        method: 'POST',
        body: JSON.stringify({
          name,
          parentId: createParentId || null,
        }),
      });
      setCreateOpen(false);
      await refreshMediaLibrary();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : s.errCreateFolder);
    } finally {
      setCreateSaving(false);
    }
  }

  async function deleteFolderFromSettings() {
    if (!folderSettings) return;
    if (isProtectedMediaFolder(folderSettings)) return;
    if (!(await confirm({ title: s.deleteFolderConfirm(folderSettings.name) }))) return;
    setFolderDeleting(true);
    setMutationError(null);
    try {
      await adminBackendJson(`catalog/admin/media/folders/${folderSettings.id}`, {
        method: 'DELETE',
      });
      if (folderFilter === folderSettings.id) setFolderFilter(null);
      setFolderSettings(null);
      await refreshMediaLibrary();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : s.errDeleteFolder);
    } finally {
      setFolderDeleting(false);
    }
  }

  async function openDetail(id: string) {
    setDetail(null);
    setDetailLoading(true);
    setMutationError(null);
    try {
      const row = await adminBackendJson<MediaObjectRow>(`catalog/admin/media/objects/${id}`);
      setDetail(row);
      setDetailOriginalName(row.originalName);
      setDetailAlt(row.altText ?? '');
      setDetailFolderId(row.folderId ?? '');
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : s.errOpenObject);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetail(null);
    setDetailLoading(false);
    setDetailOriginalName('');
  }

  async function deleteDetail() {
    if (!detail) return;
    if (!(await confirm({ title: s.deleteObjectConfirm }))) return;
    setDetailDeleting(true);
    setMutationError(null);
    try {
      await adminBackendJson(`catalog/admin/media/objects/${detail.id}`, {
        method: 'DELETE',
      });
      closeDetail();
      await refreshMediaLibrary();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : s.errDeleteObject);
    } finally {
      setDetailDeleting(false);
    }
  }

  async function saveDetail() {
    if (!detail) return;
    const name = detailOriginalName.trim();
    if (!name) {
      setMutationError(s.errNameRequired);
      return;
    }
    setDetailSaving(true);
    setMutationError(null);
    try {
      const folderId = detailFolderId === '' ? null : detailFolderId;
      const updated = await adminBackendJson<MediaObjectRow>(
        `catalog/admin/media/objects/${detail.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            originalName: name,
            altText: detailAlt.trim() || null,
            folderId,
          }),
        }
      );
      setDetail(updated);
      setDetailOriginalName(updated.originalName);
      setDetailAlt(updated.altText ?? '');
      setDetailFolderId(updated.folderId ?? '');
      await refreshMediaLibrary();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : s.errSave);
    } finally {
      setDetailSaving(false);
    }
  }

  useEffect(() => {
    if (!detail && !detailLoading) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !detailSaving && !detailDeleting) {
        setDetail(null);
        setDetailLoading(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, detailLoading, detailSaving, detailDeleting]);

  async function onPickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    /** Сначала копируем файлы: `FileList` живой — после `value = ''` он станет пустым. */
    const list = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!list.length) return;

    const batchItems: UploadBatchItem[] = list.map((file) => ({
      fileName: file.name,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'pending',
    }));

    uploadCancelledRef.current = false;
    uploadAbortRef.current = null;
    setUploadBatch(batchItems);
    setMutationError(null);
    setUploadNotice(null);
    const errors: string[] = [];
    let okCount = 0;

    try {
      for (let i = 0; i < list.length; i++) {
        if (uploadCancelledRef.current) break;

        const controller = new AbortController();
        uploadAbortRef.current = controller;

        setUploadBatch((prev) =>
          prev?.map((item, index) => (index === i ? { ...item, status: 'uploading' } : item)) ?? null,
        );

        try {
          await adminUploadMediaLibrary(list[i], folderFilter, controller.signal);
          if (uploadCancelledRef.current) break;
          okCount += 1;
          setUploadBatch((prev) =>
            prev?.map((item, index) => (index === i ? { ...item, status: 'done' } : item)) ?? null,
          );
        } catch (err) {
          if (isUploadAbortError(err) || uploadCancelledRef.current) {
            setUploadBatch(
              (prev) =>
                prev?.map((item, index) =>
                  index >= i && (item.status === 'pending' || item.status === 'uploading')
                    ? { ...item, status: 'cancelled' as const }
                    : item,
                ) ?? null,
            );
            break;
          }
          const msg = err instanceof Error ? err.message : s.errUploadFile;
          errors.push(`${list[i].name}: ${msg}`);
          setUploadBatch((prev) =>
            prev?.map((item, index) =>
              index === i ? { ...item, status: 'error', error: msg } : item,
            ) ?? null,
          );
        }
      }

      if (uploadCancelledRef.current) {
        if (okCount > 0) {
          await refreshMediaLibrary();
          setUploadNotice(s.uploadCancelledNotice(okCount));
          window.setTimeout(() => setUploadNotice(null), 5000);
        }
        dismissUploadBatch(800);
        return;
      }

      if (errors.length) {
        setMutationError(
          errors.length === list.length
            ? errors.join('\n')
            : s.uploadPartialFail(errors.length, list.length, errors.join('\n')),
        );
      }
      if (okCount > 0) {
        setUploadNotice(
          okCount === list.length ? s.uploadAllOk(okCount) : s.uploadPartialOk(okCount, list.length),
        );
        window.setTimeout(() => setUploadNotice(null), 5000);
        await refreshMediaLibrary();
      }
      dismissUploadBatch(1200);
    } catch {
      dismissUploadBatch(0);
    } finally {
      uploadAbortRef.current = null;
    }
  }

  const uploadFinishedCount =
    uploadBatch?.filter(
      (item) => item.status === 'done' || item.status === 'error' || item.status === 'cancelled',
    ).length ?? 0;
  const uploadInProgress =
    uploadBatch?.some((item) => item.status === 'pending' || item.status === 'uploading') ?? false;

  const folderList = sortedFolders(folders);

  function renderThumb(row: MediaObjectRow) {
    if (row.category === 'IMAGE') {
      return (
        <img
          className={styles.thumbImg}
          src={row.publicUrl}
          alt=""
          loading="lazy"
        />
      );
    }
    if (row.category === 'DOCUMENT') {
      return <div className={styles.thumbPlaceholder}>{s.thumbPdfDoc}</div>;
    }
    if (row.category === 'MODEL') {
      return <div className={styles.thumbPlaceholder}>{s.thumbModel3d}</div>;
    }
    if (row.category === 'VIDEO') {
      return <div className={styles.thumbPlaceholder}>{s.thumbVideo}</div>;
    }
    return <div className={styles.thumbPlaceholder}>{s.fileGeneric}</div>;
  }

  const tabs: { key: MediaLibraryTab; label: string }[] = useMemo(
    () => [
      { key: 'all', label: s.tabAll },
      { key: 'images', label: s.tabImages },
      { key: 'documents', label: s.tabDocuments },
      { key: 'models', label: s.tabModels },
      { key: 'videos', label: s.tabVideos },
    ],
    [s]
  );

  return (
    <>
      <div className={styles.tabsSpacer}>
        <AdminTabs
          compact
          ariaLabel={s.tablistMainScopeAria}
          items={[
            { id: 'winwin' as const, label: s.scopeWinwin },
            { id: 'user' as const, label: s.scopeUser },
          ]}
          activeId={libraryScope}
          onChange={setLibraryScope}
        />
      </div>
      {libraryScope === 'winwin' ? lead : null}
      {error ? (
        <p className={catalogStyles.error} style={{ whiteSpace: 'pre-line' }}>
          {error}
        </p>
      ) : null}
      {uploadNotice ? (
        <p className={catalogStyles.muted} style={{ margin: '0 0 8px' }} role="status">
          {uploadNotice}
        </p>
      ) : null}

      <div className={styles.layout}>
        <aside className={styles.folderSidebar} aria-label={s.foldersAsideLabel}>
          <div className={styles.folderSidebarTitleRow}>
            <p className={styles.folderSidebarTitle}>{s.foldersTitle}</p>
            {folderIdsWithChildren.size > 0 ? (
              <button
                type="button"
                className={styles.folderCollapseAllBtn}
                onClick={toggleCollapseAllFolders}
                aria-label={allFoldersCollapsed ? s.expandAllFoldersAria : s.collapseAllFoldersAria}
                title={allFoldersCollapsed ? s.expandAllFoldersAria : s.collapseAllFoldersAria}
              >
                <span
                  className={`${styles.folderCollapseAllChevron} ${allFoldersCollapsed ? styles.folderCollapseAllChevronCollapsed : ''}`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className={`${styles.folderBtn} ${folderFilter === null ? styles.folderBtnActive : ''}`}
            onClick={() => setFolderFilter(null)}
          >
            {s.allLocations}
          </button>
          {libraryScope === 'user' && userProfilesRootId
            ? renderFolderBranch(userProfilesRootId, 0)
            : libraryScope === 'winwin'
              ? renderFolderBranch(null, 0)
              : null}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AdminCompactBtn type="button" onClick={openCreateFolder}>
              {s.newFolderButton}
            </AdminCompactBtn>
          </div>
        </aside>

        <div className={styles.main}>
          <div className={catalogStyles.toolbar}>
            <AdminSearchBox
              className={catalogStyles.searchBoxToolbar}
              placeholder={s.searchPlaceholder}
              ariaLabel={s.searchAriaLabel}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div
              className={`${styles.uploadWrap} ${uploading ? styles.uploadLabelDisabled : ''}`}
            >
              <span
                className={`${compactStyles.btn} ${compactStyles.btnNeutral} ${styles.uploadFace}`}
                aria-hidden
              >
                <img
                  src="/icons/document-download.svg"
                  alt=""
                  width={14}
                  height={14}
                  className={styles.uploadIcon}
                />
                {uploading ? s.uploadLabelBusy : s.uploadLabel}
              </span>
              <input
                id={uploadInputId}
                type="file"
                multiple
                className={styles.fileInputOverlay}
                disabled={uploading}
                onChange={onPickUpload}
                aria-label={s.uploadAria}
                title={s.uploadTitle}
              />
            </div>
          </div>

          <div className={styles.tabsSpacer}>
            <AdminTabs
              variant="pill"
              ariaLabel={s.tablistAria}
              items={tabs.map(({ key, label }) => ({ id: key, label }))}
              activeId={tab}
              onChange={setTab}
            />
          </div>

          {loading ? (
            <p className={catalogStyles.muted}>{s.loading}</p>
          ) : objects.length === 0 ? (
            <p className={catalogStyles.muted}>{s.emptyList}</p>
          ) : (
            <ul className={styles.grid} style={objectsFetching ? { opacity: 0.65 } : undefined}>
              {objects.map((row) => (
                <li
                  key={row.id}
                  className={`${styles.objectCard} ${isHeavyMediaObject(row) ? styles.objectCardHeavy : ''}`.trim()}
                >
                  <div className={styles.thumbWrap}>
                    {renderThumb(row)}
                    <button
                      type="button"
                      className={styles.cardMenuBtn}
                      title={s.propertiesTitle}
                      aria-label={s.propertiesAria}
                      onClick={() => openDetail(row.id)}
                    >
                      ⋮
                    </button>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardTitle} title={row.originalName}>
                      {row.originalName}
                    </p>
                    <p className={styles.cardMeta}>
                      {formatKindLabel(row.mimeType, row.originalName, s.fileGeneric)}
                      {row.width && row.height
                        ? ` · ${row.width}×${row.height}`
                        : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AdminListPagination
        page={objectsPage}
        total={objectsTotal}
        limit={objectsLimit}
        onPageChange={setObjectsPage}
        disabled={objectsFetching}
      />

      {createOpen ? (
        <div
          className={modalStyles.overlay}
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && !createSaving && setCreateOpen(false)}
        >
          <div
            className={modalStyles.panel}
            role="dialog"
            aria-modal
            aria-labelledby="objects-new-folder-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={modalStyles.panelHead}>
              <h2 id="objects-new-folder-title" className={modalStyles.panelTitle}>
                {s.newFolderDialogTitle}
              </h2>
              <AdminModalCloseButton
                label={s.cancel}
                disabled={createSaving}
                onClick={() => setCreateOpen(false)}
              />
            </div>
            <form onSubmit={submitCreateFolder}>
              <div className={modalStyles.body}>
                <AdminTextField
                  label={s.labelName}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  autoFocus
                />
                <AdminSelect
                  label={s.labelParentFolder}
                  value={createParentId}
                  onChange={(e) => setCreateParentId(e.target.value)}
                >
                  <option value="">{s.rootOption}</option>
                  {folderList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {'\u00A0'.repeat(folderDepth(f.pathKey) * 2)}
                      {f.name}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <div className={modalStyles.panelFooter}>
                <AdminCompactBtn
                  type="button"
                  variant="outline"
                  disabled={createSaving}
                  onClick={() => setCreateOpen(false)}
                >
                  {s.cancel}
                </AdminCompactBtn>
                <AdminCompactBtn type="submit" variant="accent" disabled={createSaving}>
                  {createSaving ? s.creating : s.create}
                </AdminCompactBtn>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {folderSettings ? (
        <div
          className={modalStyles.overlay}
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget && !folderDeleting && setFolderSettings(null)
          }
        >
          <div
            className={modalStyles.panel}
            role="dialog"
            aria-modal
            aria-labelledby="objects-folder-settings-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={modalStyles.panelHead}>
              <h2 id="objects-folder-settings-title" className={modalStyles.panelTitle}>
                {s.folderDialogTitle}
              </h2>
              <AdminModalCloseButton
                label={s.cancel}
                disabled={folderDeleting}
                onClick={() => setFolderSettings(null)}
              />
            </div>
            <div className={modalStyles.body}>
              <AdminTextField
                label={s.labelName}
                value={folderSettings.name}
                disabled
                readOnly
              />
              <AdminTextField
                label={s.labelParentFolder}
                value={folderParentDisplayName(folderSettings, folderList, s.folderRoot)}
                disabled
                readOnly
              />
              <p className={catalogStyles.muted}>
                {s.pathStats(
                  folderSettings.pathKey,
                  folderSettings._count.objects,
                  folderSettings._count.children
                )}
              </p>
            </div>
            <div className={modalStyles.panelFooter}>
              <AdminCompactBtn
                type="button"
                variant="outline"
                disabled={folderDeleting}
                onClick={() => setFolderSettings(null)}
              >
                {s.cancel}
              </AdminCompactBtn>
              {isProtectedMediaFolder(folderSettings) ? (
                <span className={catalogStyles.muted} style={{ alignSelf: 'center' }}>
                  {s.systemFolderNoDelete}
                </span>
              ) : (
                <AdminCompactBtn
                  variant="danger"
                  type="button"
                  disabled={folderDeleting}
                  onClick={() => void deleteFolderFromSettings()}
                >
                  {folderDeleting ? s.deleting : s.delete}
                </AdminCompactBtn>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {detail || detailLoading ? (
        <div
          className={modalStyles.overlay}
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget && !detailSaving && !detailDeleting && closeDetail()
          }
        >
          <div
            className={modalStyles.panel}
            role="dialog"
            aria-modal
            aria-labelledby="objects-detail-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={modalStyles.panelHead}>
              <h2 id="objects-detail-title" className={modalStyles.panelTitle}>
                {s.detailPropertiesTitle}
              </h2>
              <AdminModalCloseButton
                label={s.close}
                disabled={detailSaving || detailDeleting}
                onClick={closeDetail}
              />
            </div>
            {detailLoading ? (
              <div className={modalStyles.body}>
                <p className={catalogStyles.muted}>{s.loading}</p>
              </div>
            ) : detail ? (
              <>
                <div className={modalStyles.body}>
                  <AdminTextField
                    label={s.fileNameLabel}
                    value={detailOriginalName}
                    onChange={(e) => setDetailOriginalName(e.target.value)}
                    autoComplete="off"
                  />
                  <div className={styles.detailMeta}>
                    <div>
                      {formatKindLabel(
                        detail.mimeType,
                        detailOriginalName || detail.originalName,
                        s.fileGeneric
                      )}
                      {detail.width && detail.height
                        ? `, ${detail.width} × ${detail.height}px`
                        : ''}
                      {`, ${formatBytes(detail.byteSize)}`}
                    </div>
                  </div>
                  <AdminSelect
                    label={s.folderLabel}
                    value={detailFolderId}
                    onChange={(e) => setDetailFolderId(e.target.value)}
                  >
                    <option value="">{s.rootOptionDetail}</option>
                    {folderList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {'\u00A0'.repeat(folderDepth(f.pathKey) * 2)}
                        {f.name}
                      </option>
                    ))}
                  </AdminSelect>
                  <AdminTextField
                    label="Alt text"
                    value={detailAlt}
                    onChange={(e) => setDetailAlt(e.target.value)}
                    placeholder={s.altDescriptionPlaceholder}
                  />
                </div>
                <div className={`${modalStyles.panelFooter} ${styles.detailFooter}`}>
                  <AdminCompactBtn
                    variant="danger"
                    type="button"
                    disabled={detailSaving || detailDeleting}
                    onClick={() => void deleteDetail()}
                  >
                    {detailDeleting ? s.deleting : s.delete}
                  </AdminCompactBtn>
                  <div className={styles.detailFooterEnd}>
                    <AdminCompactBtn
                      type="button"
                      variant="outline"
                      disabled={detailSaving || detailDeleting}
                      onClick={closeDetail}
                    >
                      {s.close}
                    </AdminCompactBtn>
                    <AdminCompactBtn
                      type="button"
                      variant="accent"
                      disabled={detailSaving || detailDeleting}
                      onClick={() => void saveDetail()}
                    >
                      {detailSaving ? s.saving : s.save}
                    </AdminCompactBtn>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {uploadBatch ? (
        <div
          className={modalStyles.overlay}
          role="dialog"
          aria-modal
          aria-labelledby="objects-upload-progress-title"
          aria-busy={uploadInProgress}
        >
          <div className={`${modalStyles.panel} ${styles.uploadProgressPanel}`}>
            <div className={modalStyles.panelHead}>
              <h2 id="objects-upload-progress-title" className={modalStyles.panelTitle}>
                {s.uploadProgressTitle}
              </h2>
            </div>
            <div className={modalStyles.body}>
              <p className={styles.uploadProgressSummary}>
                {s.uploadProgressCount(uploadFinishedCount, uploadBatch.length)}
              </p>
              <div
                className={styles.uploadProgressBar}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={uploadBatch.length}
                aria-valuenow={uploadFinishedCount}
                aria-label={s.uploadProgressTitle}
              >
                <div
                  className={styles.uploadProgressBarFill}
                  style={{ width: `${(uploadFinishedCount / uploadBatch.length) * 100}%` }}
                />
              </div>
              <ul className={styles.uploadProgressList}>
                {uploadBatch.map((item, index) => (
                  <li
                    key={`${index}-${item.fileName}`}
                    className={`${styles.uploadProgressItem} ${
                      item.status === 'done'
                        ? styles.uploadProgressItemDone
                        : item.status === 'error'
                          ? styles.uploadProgressItemError
                          : item.status === 'cancelled'
                            ? styles.uploadProgressItemCancelled
                            : ''
                    }`}
                  >
                    <div className={styles.uploadProgressThumb}>
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt="" />
                      ) : (
                        <span className={styles.uploadProgressThumbPlaceholder}>{s.fileGeneric}</span>
                      )}
                    </div>
                    <div className={styles.uploadProgressMeta}>
                      <span className={styles.uploadProgressName}>{item.fileName}</span>
                      <span
                        className={`${styles.uploadProgressStatus} ${
                          item.status === 'error' ? styles.uploadProgressStatusError : ''
                        }`}
                      >
                        {item.status === 'pending'
                          ? s.uploadStatusPending
                          : item.status === 'uploading'
                            ? s.uploadStatusUploading
                            : item.status === 'done'
                              ? s.uploadStatusDone
                              : item.status === 'cancelled'
                                ? s.uploadStatusCancelled
                                : item.error ?? s.uploadStatusError}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {uploadInProgress ? (
              <div className={modalStyles.panelFooter}>
                <AdminCompactBtn type="button" variant="outline" onClick={cancelUploadBatch}>
                  {s.cancel}
                </AdminCompactBtn>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
