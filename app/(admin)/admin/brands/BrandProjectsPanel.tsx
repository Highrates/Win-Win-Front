'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountConfirmDialog } from '@/components/AccountConfirmDialog/AccountConfirmDialog';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useUnsavedChangesGuard } from '@/lib/adminConfirm/useUnsavedChangesGuard';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminConfirm } from '@/lib/adminConfirm/AdminConfirmProvider';
import catalog from '../catalog/catalogAdmin.module.css';
import { BrandProjectEditorForm } from './BrandProjectEditorForm';
import { BrandProjectsList } from './BrandProjectsList';
import panel from './BrandProjectsPanel.module.css';
import {
  brandCaseRowToForm,
  brandProjectFormSnapshot,
  brandProjectFormToWriteBody,
  checkCoverAspect9x16,
  EMPTY_BRAND_PROJECT_FORM,
  type BrandCaseRow,
  type BrandProjectFormState,
} from './brandProjectsModel';

export function BrandProjectsPanel({
  brandId,
  brandSlug,
}: {
  brandId: string;
  brandSlug?: string;
}) {
  const { locale } = useAdminLocale();
  const common = useMemo(() => adminCommonI18n(locale), [locale]);
  const { confirm } = useAdminConfirm();

  const [list, setList] = useState<BrandCaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<BrandProjectFormState>(EMPTY_BRAND_PROJECT_FORM);
  const [baseline, setBaseline] = useState(() => brandProjectFormSnapshot(EMPTY_BRAND_PROJECT_FORM));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [roomTypeOptions, setRoomTypeOptions] = useState<string[]>([]);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [coverAspectWarn, setCoverAspectWarn] = useState<string | null>(null);
  const richPickResolver = useRef<((url: string | null) => void) | null>(null);
  const coverPickMode = useRef(false);
  const resolvedProductIds = useRef<Set<string>>(new Set());

  const formOpen = creating || Boolean(editingId);
  const dirty = formOpen && brandProjectFormSnapshot(form) !== baseline;
  useUnsavedChangesGuard(dirty);

  const resetForm = useCallback(() => {
    setCreating(false);
    setEditingId(null);
    setForm(EMPTY_BRAND_PROJECT_FORM);
    setBaseline(brandProjectFormSnapshot(EMPTY_BRAND_PROJECT_FORM));
    setSaveMsg(null);
    setCoverAspectWarn(null);
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adminBackendJson<BrandCaseRow[]>(
        `cases/admin/brands/${encodeURIComponent(brandId)}/cases`,
      );
      setList(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить проекты');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/public/site-settings', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as { caseRoomTypeOptions?: unknown };
        const opts = Array.isArray(j.caseRoomTypeOptions)
          ? j.caseRoomTypeOptions.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
          : [];
        if (!cancelled) setRoomTypeOptions(opts);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!creating && !editingId) return;
    const missing = form.products.filter(
      (p) => (!p.name || p.name === p.id) && !resolvedProductIds.current.has(p.id),
    );
    if (!missing.length) return;
    for (const p of missing) resolvedProductIds.current.add(p.id);
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/public/catalog/products/resolve-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: missing.map((p) => p.id) }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items?: Array<{ id: string; slug: string; name: string }> };
        const byId = new Map((data.items ?? []).map((i) => [i.id, i]));
        setForm((prev) => ({
          ...prev,
          products: prev.products.map((p) => {
            const hit = byId.get(p.id);
            return hit ? { id: hit.id, slug: hit.slug, name: hit.name } : p;
          }),
        }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creating, editingId, form.products]);

  async function askLeaveIfDirty(): Promise<boolean> {
    if (!dirty) return true;
    return confirm({
      title: 'Уйти без сохранения?',
      message: 'Несохранённые изменения пропадут.',
      confirmLabel: 'Уйти',
    });
  }

  async function openCreate() {
    if (!(await askLeaveIfDirty())) return;
    setEditingId(null);
    setCreating(true);
    setForm(EMPTY_BRAND_PROJECT_FORM);
    setBaseline(brandProjectFormSnapshot(EMPTY_BRAND_PROJECT_FORM));
    resolvedProductIds.current = new Set();
    setSaveMsg(null);
    setCoverAspectWarn(null);
  }

  async function openEdit(row: BrandCaseRow) {
    if (editingId === row.id && !creating) return;
    if (!(await askLeaveIfDirty())) return;
    const next = brandCaseRowToForm(row);
    setCreating(false);
    setEditingId(row.id);
    setForm(next);
    setBaseline(brandProjectFormSnapshot(next));
    resolvedProductIds.current = new Set();
    setSaveMsg(null);
    setCoverAspectWarn(null);
  }

  async function closeForm() {
    if (!(await askLeaveIfDirty())) return;
    resetForm();
  }

  async function saveForm() {
    if (!form.title.trim()) {
      setSaveMsg('Введите название');
      return;
    }
    if (form.coverUrl.trim()) {
      const ok = await checkCoverAspect9x16(form.coverUrl.trim());
      setCoverAspectWarn(
        ok
          ? null
          : 'Соотношение сторон не ~9:16 — на витрине обложка может обрезаться. Можно сохранить как есть.',
      );
    }
    setSaving(true);
    setSaveMsg(null);
    const body = brandProjectFormToWriteBody(form);
    try {
      if (editingId) {
        await adminBackendJson(
          `cases/admin/brands/${encodeURIComponent(brandId)}/cases/${encodeURIComponent(editingId)}`,
          { method: 'PATCH', body: JSON.stringify(body) },
        );
      } else {
        await adminBackendJson(`cases/admin/brands/${encodeURIComponent(brandId)}/cases`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      resetForm();
      await loadList();
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminBackendJson(
        `cases/admin/brands/${encodeURIComponent(brandId)}/cases/${encodeURIComponent(deleteId)}`,
        { method: 'DELETE' },
      );
      if (editingId === deleteId) resetForm();
      setDeleteId(null);
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  function openCoverPicker() {
    richPickResolver.current = null;
    coverPickMode.current = true;
    setPickerOpen(true);
  }

  const pickMediaFromLibrary = useCallback((kind: 'image' | 'video') => {
    return new Promise<string | null>((resolve) => {
      richPickResolver.current = resolve;
      coverPickMode.current = false;
      setPickerOpen(true);
      void kind;
    });
  }, []);

  function handlePickerPick(sel: { url: string }) {
    if (richPickResolver.current) {
      const r = richPickResolver.current;
      richPickResolver.current = null;
      r(sel.url);
      setPickerOpen(false);
      return;
    }
    if (coverPickMode.current) {
      const url = sel.url;
      coverPickMode.current = false;
      setPickerOpen(false);
      void (async () => {
        const ok = await checkCoverAspect9x16(url);
        setForm((prev) => ({ ...prev, coverUrl: url }));
        setCoverAspectWarn(
          ok ? null : 'Соотношение сторон не ~9:16 — лучше выбрать портретное изображение.',
        );
      })();
      return;
    }
    setPickerOpen(false);
  }

  function handlePickerClose() {
    if (richPickResolver.current) {
      richPickResolver.current(null);
      richPickResolver.current = null;
    }
    coverPickMode.current = false;
    setPickerOpen(false);
  }

  const vitrineHref = brandSlug?.trim()
    ? `/projects?brand=${encodeURIComponent(brandSlug.trim())}`
    : '/projects';

  return (
    <div className={catalog.tabPanelSection}>
      <MediaLibraryPickerModal
        open={pickerOpen}
        title={coverPickMode.current ? 'Обложка проекта' : 'Медиа для описания'}
        mediaFilter={coverPickMode.current ? 'image' : 'all'}
        onClose={handlePickerClose}
        onPick={handlePickerPick}
      />

      <div className={catalog.sectionHead}>
        <h2 className={catalog.groupHeading}>Проекты бренда</h2>
        <div className={panel.headActions}>
          <Link href={vitrineHref} target="_blank" rel="noopener noreferrer" className={panel.vitrineLink}>
            Открыть на витрине
          </Link>
          <AdminCompactBtn type="button" variant="accent" onClick={() => void openCreate()}>
            Добавить проект
          </AdminCompactBtn>
        </div>
      </div>

      {error ? <p className={catalog.error}>{error}</p> : null}
      {loading ? <p className={catalog.muted}>{common.loading}</p> : null}

      {!loading ? (
        <div className={`${panel.layout}${formOpen ? ` ${panel.layoutSplit}` : ''}`}>
          <BrandProjectsList
            list={list}
            editingId={editingId}
            onEdit={(row) => void openEdit(row)}
            onDelete={setDeleteId}
          />
          {formOpen ? (
            <BrandProjectEditorForm
              brandId={brandId}
              editingId={editingId}
              form={form}
              setForm={setForm}
              roomTypeOptions={roomTypeOptions}
              roomsOpen={roomsOpen}
              setRoomsOpen={setRoomsOpen}
              coverAspectWarn={coverAspectWarn}
              setCoverAspectWarn={setCoverAspectWarn}
              saveMsg={saveMsg}
              saving={saving}
              savingLabel={common.saving}
              mediaLibraryLabel={common.mediaLibrary}
              onOpenCoverPicker={openCoverPicker}
              pickMediaFromLibrary={pickMediaFromLibrary}
              onSave={() => void saveForm()}
              onCancel={() => void closeForm()}
            />
          ) : null}
        </div>
      ) : null}

      <AccountConfirmDialog
        open={Boolean(deleteId)}
        title="Удалить проект?"
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        danger
        busy={deleting}
        onClose={() => {
          if (!deleting) setDeleteId(null);
        }}
        onConfirm={() => void confirmDelete()}
      >
        <p className={panel.deleteBody}>Проект будет удалён без возможности восстановления.</p>
      </AccountConfirmDialog>
    </div>
  );
}
