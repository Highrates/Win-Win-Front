'use client';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import type { AdminProductRow } from '../catalog/products/adminProductTypes';
import styles from '../catalog/catalogAdmin.module.css';
import objStyles from '../objects/objectsLibrary.module.css';
import type { CuratedCollectionDetail } from './collectionsAdminTypes';

function rowKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type ProductRow = { key: string; productId: string; name: string; slug: string };
type BrandRow = { key: string; brandId: string; name: string; slug: string };

type BrandListRow = { id: string; name: string; slug: string };

function SortableItemRow({
  label,
  onRemove,
  rowId,
}: {
  rowId: string;
  label: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style}>
      <td className={styles.dragHandle} {...attributes} {...listeners} title="Перетащить">
        ⋮⋮
      </td>
      <td>
        <strong>{label}</strong>
      </td>
      <td>
        <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={onRemove}>
          Убрать
        </button>
      </td>
    </tr>
  );
}

function ModalCloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className={styles.modalCloseIconBtn}
      onClick={onClick}
      aria-label={label}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function CuratedCollectionEditorClient({ collectionId }: { collectionId?: string }) {
  const router = useRouter();
  const isEdit = !!collectionId;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!isEdit);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<'PRODUCT' | 'BRAND'>('PRODUCT');
  const [isActive, setIsActive] = useState(true);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverMediaObjectId, setCoverMediaObjectId] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [brandRows, setBrandRows] = useState<BrandRow[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [addQ, setAddQ] = useState('');
  const [addDebouncedQ, setAddDebouncedQ] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addProductHits, setAddProductHits] = useState<AdminProductRow[]>([]);
  const [addBrandHits, setAddBrandHits] = useState<BrandListRow[]>([]);
  const [addModalSelected, setAddModalSelected] = useState<Set<string>>(() => new Set());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selectableProductIds = useMemo(
    () =>
      addProductHits.filter((p) => !productRows.some((r) => r.productId === p.id)).map((p) => p.id),
    [addProductHits, productRows],
  );
  const selectableBrandIds = useMemo(
    () => addBrandHits.filter((b) => !brandRows.some((r) => r.brandId === b.id)).map((b) => b.id),
    [addBrandHits, brandRows],
  );
  const modalAllSelectableSelected =
    kind === 'PRODUCT'
      ? selectableProductIds.length > 0 && selectableProductIds.every((id) => addModalSelected.has(id))
      : selectableBrandIds.length > 0 && selectableBrandIds.every((id) => addModalSelected.has(id));

  useEffect(() => {
    let cancelled = false;
    if (!isEdit) {
      setLoaded(true);
      return;
    }
    void (async () => {
      setLoadError(null);
      setLoaded(false);
      try {
        const d = await adminBackendJson<CuratedCollectionDetail>(
          `catalog/admin/curated-collections/${collectionId}`,
        );
        if (cancelled) return;
        setName(d.name);
        setSlug(d.slug);
        setDescription(d.description ?? '');
        setKind(d.kind);
        setIsActive(d.isActive);
        setCoverUrl(d.coverImageUrl ?? '');
        setCoverMediaObjectId(d.coverMediaObjectId ?? null);
        setSeoTitle(d.seoTitle ?? '');
        setSeoDescription(d.seoDescription ?? '');
        setProductRows(
          d.productItems.map((it) => ({
            key: it.id,
            productId: it.productId,
            name: it.name,
            slug: it.slug,
          })),
        );
        setBrandRows(
          d.brandItems.map((it) => ({
            key: it.id,
            brandId: it.brandId,
            name: it.name,
            slug: it.slug,
          })),
        );
        setLoaded(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить');
          setLoaded(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collectionId, isEdit]);

  useEffect(() => {
    const t = setTimeout(() => setAddDebouncedQ(addQ.trim()), 300);
    return () => clearTimeout(t);
  }, [addQ]);

  const loadAddHits = useCallback(async () => {
    if (!addPickerOpen) return;
    setAddLoading(true);
    try {
      const q = addDebouncedQ ? `?q=${encodeURIComponent(addDebouncedQ)}` : '';
      if (kind === 'PRODUCT') {
        const data = await adminBackendJson<AdminProductRow[]>(`catalog/admin/products${q}`);
        setAddProductHits(data);
        setAddBrandHits([]);
      } else {
        const data = await adminBackendJson<
          { id: string; name: string; slug: string }[]
        >(`catalog/admin/brands${q}`);
        setAddBrandHits(data.map((b) => ({ id: b.id, name: b.name, slug: b.slug })));
        setAddProductHits([]);
      }
    } catch {
      setAddProductHits([]);
      setAddBrandHits([]);
    } finally {
      setAddLoading(false);
    }
  }, [addPickerOpen, addDebouncedQ, kind]);

  useEffect(() => {
    loadAddHits();
  }, [loadAddHits]);

  useEffect(() => {
    if (addPickerOpen) setAddModalSelected(new Set());
  }, [addDebouncedQ, addPickerOpen]);

  function toggleModalSelectAll() {
    const ids = kind === 'PRODUCT' ? selectableProductIds : selectableBrandIds;
    if (modalAllSelectableSelected) {
      setAddModalSelected((prev) => {
        const n = new Set(prev);
        for (const id of ids) n.delete(id);
        return n;
      });
    } else {
      setAddModalSelected((prev) => {
        const n = new Set(prev);
        for (const id of ids) n.add(id);
        return n;
      });
    }
  }

  function toggleAddModalRow(id: string) {
    setAddModalSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function commitAddModalSelection() {
    if (kind === 'PRODUCT') {
      const picks = Array.from(addModalSelected)
        .map((id) => addProductHits.find((x) => x.id === id))
        .filter((p): p is AdminProductRow => !!p && !productRows.some((r) => r.productId === p.id));
      setProductRows((prev) => [
        ...prev,
        ...picks.map((p) => ({ key: rowKey(), productId: p.id, name: p.name, slug: p.slug })),
      ]);
    } else {
      const picks = Array.from(addModalSelected)
        .map((id) => addBrandHits.find((x) => x.id === id))
        .filter((b): b is BrandListRow => !!b && !brandRows.some((r) => r.brandId === b.id));
      setBrandRows((prev) => [
        ...prev,
        ...picks.map((b) => ({ key: rowKey(), brandId: b.id, name: b.name, slug: b.slug })),
      ]);
    }
    setAddModalSelected(new Set());
    setAddPickerOpen(false);
    setAddQ('');
  }

  function changeKind(next: 'PRODUCT' | 'BRAND') {
    if (next === kind) return;
    const has = productRows.length > 0 || brandRows.length > 0;
    if (has && !window.confirm('Сменить тип коллекции? Текущий список позиций будет очищен.')) {
      return;
    }
    setKind(next);
    setProductRows([]);
    setBrandRows([]);
  }

  function onProductDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = productRows.findIndex((r) => r.key === active.id);
    const newIndex = productRows.findIndex((r) => r.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setProductRows((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  function onBrandDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = brandRows.findIndex((r) => r.key === active.id);
    const newIndex = brandRows.findIndex((r) => r.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setBrandRows((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSaveError('Укажите название');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: nameTrim,
        description: description.trim() || null,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        kind,
        isActive,
      };
      if (slug.trim()) body.slug = slug.trim();
      if (coverUrl.trim()) {
        body.coverImageUrl = coverUrl.trim();
        if (coverMediaObjectId) body.coverMediaObjectId = coverMediaObjectId;
      } else {
        body.coverImageUrl = null;
      }
      if (kind === 'PRODUCT') body.productIds = productRows.map((r) => r.productId);
      if (kind === 'BRAND') body.brandIds = brandRows.map((r) => r.brandId);

      if (isEdit) {
        await adminBackendJson(`catalog/admin/curated-collections/${collectionId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        const created = await adminBackendJson<CuratedCollectionDetail>(
          'catalog/admin/curated-collections',
          {
            method: 'POST',
            body: JSON.stringify(body),
          },
        );
        await revalidatePublicCatalogCache();
        router.push(`/admin/collections/${created.id}`);
        router.refresh();
        return;
      }
      await revalidatePublicCatalogCache();
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !loaded && !loadError) {
    return <p className={styles.muted}>Загрузка…</p>;
  }

  return (
    <>
      <p className={styles.backRow}>
        <Link className={styles.backLink} href="/admin/collections">
          ← К списку коллекций
        </Link>
      </p>

      {loadError ? <p className={styles.error}>{loadError}</p> : null}

      <MediaLibraryPickerModal
        open={coverPickerOpen}
        title="Обложка коллекции"
        mediaFilter="image"
        onClose={() => setCoverPickerOpen(false)}
        onPick={(sel) => {
          setCoverUrl(sel.url);
          setCoverMediaObjectId(sel.id);
          setCoverPickerOpen(false);
          setSaveError(null);
        }}
      />

      {addPickerOpen ? (
        <div
          className={objStyles.modalBackdrop}
          role="dialog"
          aria-modal
          aria-label={kind === 'PRODUCT' ? 'Добавить товар' : 'Добавить бренд'}
          onClick={() => setAddPickerOpen(false)}
        >
          <div
            className={objStyles.modal}
            onClick={(ev) => ev.stopPropagation()}
            style={{ maxWidth: 640, width: '100%' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <h2 className={objStyles.modalTitle} style={{ margin: 0, paddingRight: 8 }}>
                {kind === 'PRODUCT' ? 'Добавить товар' : 'Добавить бренд'}
              </h2>
              <ModalCloseButton onClick={() => setAddPickerOpen(false)} label="Закрыть" />
            </div>
            <input
              type="search"
              className={styles.search}
              style={{ width: '100%', maxWidth: 'none', marginBottom: 12 }}
              placeholder="Поиск…"
              value={addQ}
              onChange={(e) => setAddQ(e.target.value)}
              aria-label="Поиск"
            />
            <div className={styles.tableWrap} style={{ maxHeight: 320, overflow: 'auto' }}>
              {addLoading ? (
                <p className={styles.muted}>Загрузка…</p>
              ) : kind === 'PRODUCT' ? (
                addProductHits.length === 0 ? (
                  <p className={styles.muted}>Ничего не найдено.</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>
                          <AccountCheckbox
                            id="curated-add-select-all"
                            className={styles.adminCheckboxInTable}
                            checked={modalAllSelectableSelected}
                            onChange={toggleModalSelectAll}
                            disabled={!selectableProductIds.length}
                            aria-label="Выбрать все в списке"
                          />
                        </th>
                        <th>Название</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addProductHits.map((p) => {
                        const inCol = productRows.some((r) => r.productId === p.id);
                        return (
                          <tr key={p.id} className={inCol ? styles.rowInactive : undefined}>
                            <td>
                              <AccountCheckbox
                                id={`curated-add-p-${p.id}`}
                                className={styles.adminCheckboxInTable}
                                disabled={inCol}
                                checked={!inCol && addModalSelected.has(p.id)}
                                onChange={() => toggleAddModalRow(p.id)}
                                aria-label={`Выбрать ${p.name}`}
                              />
                            </td>
                            <td>
                              {p.name}
                              {inCol ? (
                                <span className={styles.muted} style={{ marginLeft: 6 }}>
                                  — в коллекции
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : addBrandHits.length === 0 ? (
                <p className={styles.muted}>Ничего не найдено.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>
                        <AccountCheckbox
                          id="curated-add-select-all-brands"
                          className={styles.adminCheckboxInTable}
                          checked={modalAllSelectableSelected}
                          onChange={toggleModalSelectAll}
                          disabled={!selectableBrandIds.length}
                          aria-label="Выбрать все в списке"
                        />
                      </th>
                      <th>Название</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addBrandHits.map((b) => {
                      const inCol = brandRows.some((r) => r.brandId === b.id);
                      return (
                        <tr key={b.id} className={inCol ? styles.rowInactive : undefined}>
                          <td>
                            <AccountCheckbox
                              id={`curated-add-b-${b.id}`}
                              className={styles.adminCheckboxInTable}
                              disabled={inCol}
                              checked={!inCol && addModalSelected.has(b.id)}
                              onChange={() => toggleAddModalRow(b.id)}
                              aria-label={`Выбрать ${b.name}`}
                            />
                          </td>
                          <td>
                            {b.name}
                            {inCol ? (
                              <span className={styles.muted} style={{ marginLeft: 6 }}>
                                — в коллекции
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 14,
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                className={styles.btn}
                onClick={() => setAddModalSelected(new Set())}
                disabled={!addModalSelected.size}
              >
                Снять выбор
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={!addModalSelected.size}
                onClick={commitAddModalSelection}
              >
                Добавить выбранные
                {addModalSelected.size ? ` (${addModalSelected.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <form className={`${styles.form} ${styles.formWide}`} onSubmit={submit}>
        <h1 className={styles.title}>{isEdit ? 'Редактирование коллекции' : 'Новая коллекция'}</h1>

        <label className={styles.label}>
          Название коллекции
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          Slug <span className={styles.muted}>(необязательно)</span>
          <input
            className={styles.input}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="из названия"
          />
        </label>

        <label className={styles.label}>
          Описание
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </label>

        <fieldset className={styles.label} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className={styles.label} style={{ marginBottom: 8 }}>
            Содержимое коллекции
          </legend>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="col-kind"
                checked={kind === 'PRODUCT'}
                onChange={() => changeKind('PRODUCT')}
              />
              Товары
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="col-kind"
                checked={kind === 'BRAND'}
                onChange={() => changeKind('BRAND')}
              />
              Бренды
            </label>
          </div>
        </fieldset>

        <div className={styles.label}>
          Обложка коллекции
          <div className={styles.fileRow}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => {
                setSaveError(null);
                setCoverPickerOpen(true);
              }}
            >
              Выбрать из медиатеки
            </button>
            {coverUrl.trim() ? (
              <button
                type="button"
                className={styles.btn}
                onClick={() => {
                  setCoverUrl('');
                  setCoverMediaObjectId(null);
                }}
              >
                Убрать обложку
              </button>
            ) : null}
          </div>
          {coverUrl.trim() ? (
            <div className={styles.bgPreview} style={{ marginTop: 10, maxWidth: 360 }}>
              <img src={coverUrl.trim()} alt="" />
            </div>
          ) : null}
        </div>

        <div className={styles.label}>
          <div className={styles.labelCheckboxRow}>
            <AccountCheckbox
              id="curated-collection-active"
              className={styles.adminCheckboxForm}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              aria-label="Доступна на витрине"
            />
            <label htmlFor="curated-collection-active">Доступна на витрине</label>
          </div>
        </div>

        <h2 className={styles.sectionTitle} style={{ marginTop: 24 }}>
          SEO
        </h2>
        <label className={styles.label}>
          Meta title
          <input className={styles.input} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </label>
        <label className={styles.label}>
          Meta description
          <textarea
            className={styles.textarea}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
          />
        </label>

        <h2 className={styles.sectionTitle} style={{ marginTop: 24 }}>
          {kind === 'PRODUCT' ? 'Товары в коллекции' : 'Бренды в коллекции'}
        </h2>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnAlignStart}`}
          style={{ marginBottom: 12 }}
          onClick={() => {
            setAddQ('');
            setAddModalSelected(new Set());
            setAddPickerOpen(true);
          }}
        >
          {kind === 'PRODUCT' ? '+ Добавить товар' : '+ Добавить бренд'}
        </button>

        {kind === 'PRODUCT' ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onProductDragEnd}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }} aria-label="Порядок" />
                    <th>Название</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {productRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={styles.muted}>
                        Позиций пока нет.
                      </td>
                    </tr>
                  ) : (
                    <SortableContext
                      items={productRows.map((r) => r.key)}
                      strategy={verticalListSortingStrategy}
                    >
                      {productRows.map((row) => (
                        <SortableItemRow
                          key={row.key}
                          rowId={row.key}
                          label={row.name}
                          onRemove={() =>
                            setProductRows((prev) => prev.filter((r) => r.key !== row.key))
                          }
                        />
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
            </div>
          </DndContext>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onBrandDragEnd}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }} aria-label="Порядок" />
                    <th>Название</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {brandRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={styles.muted}>
                        Позиций пока нет.
                      </td>
                    </tr>
                  ) : (
                    <SortableContext
                      items={brandRows.map((r) => r.key)}
                      strategy={verticalListSortingStrategy}
                    >
                      {brandRows.map((row) => (
                        <SortableItemRow
                          key={row.key}
                          rowId={row.key}
                          label={row.name}
                          onRemove={() =>
                            setBrandRows((prev) => prev.filter((r) => r.key !== row.key))
                          }
                        />
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
            </div>
          </DndContext>
        )}

        {saveError ? <p className={styles.error}>{saveError}</p> : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving || !!loadError || (isEdit && !loaded)}
          >
            {saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать коллекцию'}
          </button>
          <Link href="/admin/collections" className={styles.btn}>
            Отмена
          </Link>
        </div>
      </form>
    </>
  );
}
