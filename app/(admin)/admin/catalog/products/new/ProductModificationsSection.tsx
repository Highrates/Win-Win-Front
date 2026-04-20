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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { createClientRandomId } from '@/lib/clientRandomId';
import catalogStyles from '../../catalogAdmin.module.css';
import pn from './productNew.module.css';
import type {
  AdminProductModification,
  ProductAdminDetail,
} from '../adminProductTypes';

type ModificationRow = {
  id: string;
  serverId?: string;
  name: string;
  modificationSlug: string | null;
};

function rowId() {
  return createClientRandomId();
}

function modificationFromAdmin(m: AdminProductModification): ModificationRow {
  return {
    id: rowId(),
    serverId: m.id,
    name: m.name,
    modificationSlug: m.modificationSlug,
  };
}

function SortableModificationRow({
  mod,
  onChange,
  onRemove,
}: {
  mod: ModificationRow;
  onChange: (next: ModificationRow) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className={pn.repeatRow}>
      <button
        type="button"
        className={pn.dragHandle}
        {...attributes}
        {...listeners}
        title="Перетащить модификацию"
        aria-label="Перетащить модификацию"
      >
        ⋮⋮
      </button>
      <input
        type="text"
        className={catalogStyles.input}
        style={{ flex: 1, minWidth: 200 }}
        placeholder="Напр. 2000×800 — угловой левый"
        value={mod.name}
        onChange={(e) => onChange({ ...mod, name: e.target.value })}
      />
      <input
        type="text"
        className={catalogStyles.input}
        style={{ width: 200 }}
        placeholder="slug (авто)"
        value={mod.modificationSlug ?? ''}
        onChange={(e) => onChange({ ...mod, modificationSlug: e.target.value || null })}
      />
      <button
        type="button"
        className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
        onClick={onRemove}
      >
        Удалить
      </button>
    </div>
  );
}

type Props = {
  productId: string;
  initialModifications: AdminProductModification[];
  onProductMutated: (next: ProductAdminDetail) => void;
};

export function ProductModificationsSection({
  productId,
  initialModifications,
  onProductMutated,
}: Props) {
  const [modifications, setModifications] = useState<ModificationRow[]>(() =>
    initialModifications.map(modificationFromAdmin),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgKind, setMsgKind] = useState<'ok' | 'err'>('ok');

  useEffect(() => {
    setModifications(initialModifications.map(modificationFromAdmin));
  }, [initialModifications]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const hasAnyUnnamed = useMemo(
    () => modifications.some((m) => !m.name.trim()),
    [modifications],
  );

  function onModDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = modifications.findIndex((m) => m.id === active.id);
    const newIndex = modifications.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setModifications((m) => arrayMove(m, oldIndex, newIndex));
  }

  function addModification() {
    setModifications((prev) => [
      ...prev,
      { id: rowId(), name: '', modificationSlug: null },
    ]);
  }

  function removeModification(mid: string) {
    setModifications((prev) => prev.filter((m) => m.id !== mid));
  }

  function updateModification(mid: string, next: ModificationRow) {
    setModifications((prev) => prev.map((m) => (m.id === mid ? next : m)));
  }

  const saveModifications = useCallback(async () => {
    setMsg(null);
    if (hasAnyUnnamed) {
      setMsgKind('err');
      setMsg('У всех модификаций должно быть название');
      return;
    }
    const payload = {
      modifications: modifications.map((m, idx) => ({
        ...(m.serverId ? { id: m.serverId } : {}),
        name: m.name.trim(),
        modificationSlug: m.modificationSlug?.trim() || null,
        sortOrder: idx,
      })),
    };
    setSaving(true);
    try {
      await adminBackendJson<unknown>(
        `catalog/admin/products/${productId}/modifications`,
        { method: 'PATCH', body: JSON.stringify(payload) },
      );
      const fresh = await adminBackendJson<ProductAdminDetail>(
        `catalog/admin/products/${productId}`,
      );
      const matched = modifications.map((local, idx) => {
        const server = fresh.modifications[idx];
        if (!server) return local;
        return {
          ...local,
          serverId: server.id,
          modificationSlug: server.modificationSlug,
        };
      });
      setModifications(matched);
      onProductMutated(fresh);
      await revalidatePublicCatalogCache();
      setMsgKind('ok');
      setMsg('Модификации сохранены');
    } catch (err) {
      setMsgKind('err');
      setMsg(err instanceof Error ? err.message : 'Ошибка сохранения модификаций');
    } finally {
      setSaving(false);
    }
  }, [hasAnyUnnamed, modifications, productId, onProductMutated]);

  return (
    <div className={pn.section}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <h2 className={pn.sectionTitle} style={{ margin: 0 }}>
          Модификации товара
        </h2>
        <button
          type="button"
          className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}
          onClick={() => {
            void saveModifications();
          }}
          disabled={saving}
        >
          {saving ? 'Сохранение…' : 'Сохранить модификации'}
        </button>
      </div>

      {modifications.length === 0 ? (
        <p className={catalogStyles.muted}>
          Ещё нет модификаций. Нажмите «+ Модификация», чтобы добавить.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onModDragEnd}>
          <SortableContext
            items={modifications.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={pn.repeatList}>
              {modifications.map((m) => (
                <SortableModificationRow
                  key={m.id}
                  mod={m}
                  onChange={(next) => updateModification(m.id, next)}
                  onRemove={() => removeModification(m.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className={catalogStyles.btn} onClick={addModification}>
          + Модификация
        </button>
      </div>

      {msg ? (
        <p
          className={msgKind === 'ok' ? catalogStyles.muted : catalogStyles.error}
          style={{ marginTop: 8 }}
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
