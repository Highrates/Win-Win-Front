'use client';

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
import catalogStyles from '../catalog/catalogAdmin.module.css';
import styles from './objectsLibrary.module.css';

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

/** Отступ подписей в селектах (плоский список по pathKey) */
function folderDepth(pathKey: string): number {
  return Math.max(0, pathKey.split('/').length - 1);
}

function sortedFolders(rows: MediaFolderRow[]): MediaFolderRow[] {
  return [...rows].sort((a, b) => a.pathKey.localeCompare(b.pathKey));
}

const PROTECTED_FOLDER_PATH_PREFIX = 'category-backgrounds';

function isProtectedMediaFolder(f: MediaFolderRow): boolean {
  return (
    f.pathKey === PROTECTED_FOLDER_PATH_PREFIX ||
    f.pathKey.startsWith(`${PROTECTED_FOLDER_PATH_PREFIX}/`)
  );
}

function folderParentDisplayName(f: MediaFolderRow, all: MediaFolderRow[]): string {
  if (!f.parentId) return 'Корень';
  return all.find((x) => x.id === f.parentId)?.name ?? '—';
}

export function ObjectsLibraryClient() {
  const uploadInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<MediaLibraryTab>('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [folderFilter, setFolderFilter] = useState<string | null>(null);

  const [folders, setFolders] = useState<MediaFolderRow[]>([]);
  const [objects, setObjects] = useState<MediaObjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function toggleFolderCollapse(id: string) {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
                  isCollapsed ? 'Развернуть вложенные папки' : 'Свернуть вложенные папки'
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
              >
                {f.name}
                <span className={styles.cardMeta}> · {f._count.objects}</span>
              </button>
              <button
                type="button"
                className={styles.folderMenuBtn}
                title="Настройки папки"
                aria-label="Настройки папки"
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
        `catalog/admin/media/objects?${sp.toString()}`
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
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    loadObjects();
  }, [loadObjects]);

  function openCreateFolder() {
    setCreateName('');
    setCreateParentId(folderFilter ?? '');
    setCreateOpen(true);
  }

  async function submitCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    const name = createName.trim();
    if (!name) return;
    setCreateSaving(true);
    setError(null);
    try {
      await adminBackendJson<MediaFolderRow>('catalog/admin/media/folders', {
        method: 'POST',
        body: JSON.stringify({
          name,
          parentId: createParentId || null,
        }),
      });
      setCreateOpen(false);
      await loadFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать папку');
    } finally {
      setCreateSaving(false);
    }
  }

  async function deleteFolderFromSettings() {
    if (!folderSettings) return;
    if (isProtectedMediaFolder(folderSettings)) return;
    const ok = window.confirm(
      `Удалить папку «${folderSettings.name}»? Должна быть пустой (без вложенных папок и файлов).`
    );
    if (!ok) return;
    setFolderDeleting(true);
    setError(null);
    try {
      await adminBackendJson(`catalog/admin/media/folders/${folderSettings.id}`, {
        method: 'DELETE',
      });
      if (folderFilter === folderSettings.id) setFolderFilter(null);
      setFolderSettings(null);
      await loadFolders();
      await loadObjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить папку');
    } finally {
      setFolderDeleting(false);
    }
  }

  async function openDetail(id: string) {
    setDetail(null);
    setDetailLoading(true);
    setError(null);
    try {
      const row = await adminBackendJson<MediaObjectRow>(`catalog/admin/media/objects/${id}`);
      setDetail(row);
      setDetailOriginalName(row.originalName);
      setDetailAlt(row.altText ?? '');
      setDetailFolderId(row.folderId ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось открыть объект');
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
    const ok = window.confirm(
      'Удалить объект из хранилища? Ссылка перестанет работать. Действие необратимо.'
    );
    if (!ok) return;
    setDetailDeleting(true);
    setError(null);
    try {
      await adminBackendJson(`catalog/admin/media/objects/${detail.id}`, {
        method: 'DELETE',
      });
      closeDetail();
      await loadObjects();
      await loadFolders();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setDetailDeleting(false);
    }
  }

  async function saveDetail() {
    if (!detail) return;
    const name = detailOriginalName.trim();
    if (!name) {
      setError('Укажите имя файла');
      return;
    }
    setDetailSaving(true);
    setError(null);
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
      await loadObjects();
      await loadFolders();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
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
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await adminUploadMediaLibrary(file, folderFilter);
      await loadObjects();
      await loadFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }

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
      return <div className={styles.thumbPlaceholder}>PDF / документ</div>;
    }
    if (row.category === 'MODEL') {
      return <div className={styles.thumbPlaceholder}>3D модель</div>;
    }
    if (row.category === 'VIDEO') {
      return <div className={styles.thumbPlaceholder}>Видео</div>;
    }
    return <div className={styles.thumbPlaceholder}>Файл</div>;
  }

  const tabs: { key: MediaLibraryTab; label: string }[] = [
    { key: 'all', label: 'Все объекты' },
    { key: 'images', label: 'Изображения' },
    { key: 'documents', label: 'Документы' },
    { key: 'models', label: '3D модели' },
    { key: 'videos', label: 'Видео' },
  ];

  return (
    <>
      {error ? <p className={catalogStyles.error}>{error}</p> : null}

      <div className={styles.layout}>
        <aside className={styles.folderSidebar} aria-label="Папки">
          <p className={styles.folderSidebarTitle}>Папки</p>
          <button
            type="button"
            className={`${styles.folderBtn} ${folderFilter === null ? styles.folderBtnActive : ''}`}
            onClick={() => setFolderFilter(null)}
          >
            Все расположения
          </button>
          {renderFolderBranch(null, 0)}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className={catalogStyles.btn}
              onClick={openCreateFolder}
            >
              Новая папка
            </button>
          </div>
        </aside>

        <div className={styles.main}>
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
              className={styles.hiddenInput}
              onChange={onPickUpload}
            />
            <TBtn
              variant="ghost"
              type="button"
              className={styles.uploadGhost}
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <img src="/icons/document-download.svg" alt="" width={20} height={20} />
              {uploading ? 'Загрузка…' : 'Загрузить файл'}
            </TBtn>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Тип объекта">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className={catalogStyles.muted}>Загрузка…</p>
          ) : objects.length === 0 ? (
            <p className={catalogStyles.muted}>Нет объектов по текущим фильтрам.</p>
          ) : (
            <ul className={styles.grid}>
              {objects.map((row) => (
                <li key={row.id} className={styles.objectCard}>
                  <div className={styles.thumbWrap}>
                    {renderThumb(row)}
                    <button
                      type="button"
                      className={styles.cardMenuBtn}
                      title="Свойства"
                      aria-label="Свойства объекта"
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
                      {formatKindLabel(row.mimeType, row.originalName)}
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

      {createOpen ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => !createSaving && setCreateOpen(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal
            aria-labelledby="objects-new-folder-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="objects-new-folder-title" className={styles.dialogTitle}>
              Новая папка
            </h2>
            <form onSubmit={submitCreateFolder} className={catalogStyles.form}>
              <label className={catalogStyles.label}>
                Название
                <input
                  className={catalogStyles.input}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label className={catalogStyles.label}>
                Родительская папка
                <select
                  className={styles.modalSelect}
                  value={createParentId}
                  onChange={(e) => setCreateParentId(e.target.value)}
                >
                  <option value="">Корень</option>
                  {folderList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {'\u00A0'.repeat(folderDepth(f.pathKey) * 2)}
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.modalActionsCreate}>
                <TBtn
                  type="button"
                  className={styles.modalTBtn}
                  disabled={createSaving}
                  onClick={() => setCreateOpen(false)}
                >
                  Отмена
                </TBtn>
                <Button
                  variant="primary"
                  type="submit"
                  className={styles.modalFooterBtn}
                  disabled={createSaving}
                >
                  {createSaving ? 'Создание…' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {folderSettings ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => !folderDeleting && setFolderSettings(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal
            aria-labelledby="objects-folder-settings-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="objects-folder-settings-title" className={styles.dialogTitle}>
              Папка
            </h2>
            <div className={catalogStyles.form}>
              <label className={catalogStyles.label}>
                Название
                <input
                  className={`${styles.modalInput} ${styles.modalInputReadonly}`}
                  value={folderSettings.name}
                  disabled
                  readOnly
                />
              </label>
              <label className={catalogStyles.label}>
                Родительская папка
                <input
                  className={`${styles.modalInput} ${styles.modalInputReadonly}`}
                  value={folderParentDisplayName(folderSettings, folderList)}
                  disabled
                  readOnly
                />
              </label>
              <p className={catalogStyles.muted} style={{ margin: '0 0 4px' }}>
                Путь: {folderSettings.pathKey} · объектов: {folderSettings._count.objects}, вложенных
                папок: {folderSettings._count.children}
              </p>
              <div className={styles.modalActionsCreate}>
                <TBtn
                  type="button"
                  className={styles.modalTBtn}
                  disabled={folderDeleting}
                  onClick={() => setFolderSettings(null)}
                >
                  Отмена
                </TBtn>
                {isProtectedMediaFolder(folderSettings) ? (
                  <span className={catalogStyles.muted} style={{ alignSelf: 'center' }}>
                    Системная папка — удаление недоступно
                  </span>
                ) : (
                  <TBtn
                    variant="danger"
                    type="button"
                    className={styles.modalTBtn}
                    disabled={folderDeleting}
                    onClick={() => void deleteFolderFromSettings()}
                  >
                    {folderDeleting ? 'Удаление…' : 'Удалить'}
                  </TBtn>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {detail || detailLoading ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => !detailSaving && !detailDeleting && closeDetail()}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal
            aria-labelledby="objects-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <p className={catalogStyles.muted}>Загрузка…</p>
            ) : detail ? (
              <>
                <h2 id="objects-detail-title" className={styles.modalTitle}>
                  Свойства
                </h2>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel} htmlFor="objects-detail-name">
                    Имя файла
                  </label>
                  <input
                    id="objects-detail-name"
                    className={styles.modalInput}
                    value={detailOriginalName}
                    onChange={(e) => setDetailOriginalName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.modalStats}>
                  <div>
                    {formatKindLabel(detail.mimeType, detailOriginalName || detail.originalName)}
                    {detail.width && detail.height
                      ? `, ${detail.width} × ${detail.height}px`
                      : ''}
                    {`, ${formatBytes(detail.byteSize)}`}
                  </div>
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel} htmlFor="objects-detail-folder">
                    Папка
                  </label>
                  <select
                    id="objects-detail-folder"
                    className={styles.modalSelect}
                    value={detailFolderId}
                    onChange={(e) => setDetailFolderId(e.target.value)}
                  >
                    <option value="">Корень (без папки)</option>
                    {folderList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {'\u00A0'.repeat(folderDepth(f.pathKey) * 2)}
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.modalField}>
                  <label className={styles.modalLabel} htmlFor="objects-detail-alt">
                    Alt text
                  </label>
                  <input
                    id="objects-detail-alt"
                    className={styles.modalInput}
                    value={detailAlt}
                    onChange={(e) => setDetailAlt(e.target.value)}
                    placeholder="Описание для доступности"
                  />
                </div>
                <div className={styles.modalActions}>
                  <TBtn
                    variant="danger"
                    type="button"
                    className={styles.modalTBtn}
                    disabled={detailSaving || detailDeleting}
                    onClick={() => void deleteDetail()}
                  >
                    {detailDeleting ? 'Удаление…' : 'Удалить'}
                  </TBtn>
                  <div className={styles.modalActionsEnd}>
                    <TBtn
                      type="button"
                      className={styles.modalTBtn}
                      disabled={detailSaving || detailDeleting}
                      onClick={closeDetail}
                    >
                      Закрыть
                    </TBtn>
                    <Button
                      variant="primary"
                      type="button"
                      className={styles.modalFooterBtn}
                      disabled={detailSaving || detailDeleting}
                      onClick={() => void saveDetail()}
                    >
                      {detailSaving ? 'Сохранение…' : 'Сохранить'}
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
