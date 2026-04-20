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
import { BrandMaterialColorPickerModal } from '@/components/admin/BrandMaterialColorPickerModal/BrandMaterialColorPickerModal';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductElementsStrings } from '@/lib/admin-i18n/adminProductElementsI18n';
import { createClientRandomId } from '@/lib/clientRandomId';
import catalogStyles from '../../catalogAdmin.module.css';
import pn from './productNew.module.css';
import type {
  AdminProductElement,
  AdminProductElementAvailability,
  ProductAdminDetail,
} from '../adminProductTypes';

type AvailabilityRow = {
  brandMaterialColorId: string;
  materialName: string;
  colorName: string;
  imageUrl: string | null;
};

type ElementRow = {
  id: string;
  serverId?: string;
  name: string;
  availabilities: AvailabilityRow[];
};

function rowId() {
  return createClientRandomId();
}

function availabilityFromAdmin(a: AdminProductElementAvailability): AvailabilityRow {
  return {
    brandMaterialColorId: a.brandMaterialColorId,
    materialName: a.materialName,
    colorName: a.colorName,
    imageUrl: a.imageUrl,
  };
}

function elementFromAdmin(el: AdminProductElement): ElementRow {
  return {
    id: rowId(),
    serverId: el.id,
    name: el.name,
    availabilities: el.availabilities.map(availabilityFromAdmin),
  };
}

function SortableElementCard({
  el,
  strings: es,
  onChange,
  onRemove,
  onOpenPicker,
  onRemoveAvailability,
}: {
  el: ElementRow;
  strings: ReturnType<typeof adminProductElementsStrings>;
  onChange: (patch: Partial<ElementRow>) => void;
  onRemove: () => void;
  onOpenPicker: () => void;
  onRemoveAvailability: (bmcId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: el.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        border: '1px solid #e2e6e8',
        borderRadius: 8,
        padding: 10,
        background: '#fff',
      }}
    >
      <div className={pn.repeatRow}>
        <button
          type="button"
          className={pn.dragHandle}
          {...attributes}
          {...listeners}
          title={es.dragEl}
          aria-label={es.dragElAria}
        >
          ⋮⋮
        </button>
        <input
          type="text"
          className={catalogStyles.input}
          style={{ flex: 1, minWidth: 180 }}
          placeholder={es.namePh}
          value={el.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <button
          type="button"
          className={`${catalogStyles.btn} ${catalogStyles.btnDanger}`}
          onClick={onRemove}
        >
          {es.delete}
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span className={catalogStyles.muted}>{es.poolLabel}</span>
          <button type="button" className={catalogStyles.btn} onClick={onOpenPicker}>
            {es.pickFromBrand}
          </button>
        </div>
        {el.availabilities.length === 0 ? (
          <p className={catalogStyles.muted} style={{ marginTop: 4 }}>
            {es.poolEmpty}
          </p>
        ) : (
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            {el.availabilities.map((a) => (
              <li
                key={a.brandMaterialColorId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px 4px 4px',
                  border: '1px solid #c5d4e0',
                  borderRadius: 999,
                  background: '#fff',
                }}
              >
                {a.imageUrl ? (
                  <img
                    src={a.imageUrl}
                    alt=""
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    aria-hidden
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#f5f7f8',
                      display: 'inline-block',
                    }}
                  />
                )}
                <span style={{ fontSize: 13 }}>
                  <strong>{a.materialName}</strong> / {a.colorName}
                </span>
                <button
                  type="button"
                  className={catalogStyles.btn}
                  style={{ padding: '2px 8px', minHeight: 0 }}
                  onClick={() => onRemoveAvailability(a.brandMaterialColorId)}
                  aria-label={es.removeFromElAria}
                  title={es.removeFromElTitle}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type Props = {
  productId: string;
  brandId: string | null;
  initialElements: AdminProductElement[];
  onProductMutated: (next: ProductAdminDetail) => void;
};

export function ProductElementsSection({
  productId,
  brandId,
  initialElements,
  onProductMutated,
}: Props) {
  const { locale } = useAdminLocale();
  const elStr = useMemo(() => adminProductElementsStrings(locale), [locale]);
  const [elements, setElements] = useState<ElementRow[]>(() =>
    initialElements.map(elementFromAdmin),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgKind, setMsgKind] = useState<'ok' | 'err'>('ok');
  const [pickerElementId, setPickerElementId] = useState<string | null>(null);

  useEffect(() => {
    setElements(initialElements.map(elementFromAdmin));
  }, [initialElements]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = elements.findIndex((el) => el.id === active.id);
    const newIndex = elements.findIndex((el) => el.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setElements((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  function addElement() {
    setElements((prev) => [...prev, { id: rowId(), name: '', availabilities: [] }]);
  }

  function removeElement(eid: string) {
    setElements((prev) => prev.filter((el) => el.id !== eid));
  }

  function updateElement(eid: string, patch: Partial<ElementRow>) {
    setElements((prev) => prev.map((el) => (el.id === eid ? { ...el, ...patch } : el)));
  }

  function removeAvailability(eid: string, bmcId: string) {
    setElements((prev) =>
      prev.map((el) =>
        el.id !== eid
          ? el
          : {
              ...el,
              availabilities: el.availabilities.filter((a) => a.brandMaterialColorId !== bmcId),
            },
      ),
    );
  }

  const pickerElement = elements.find((el) => el.id === pickerElementId) ?? null;

  const saveElements = useCallback(async () => {
    setMsg(null);
    if (elements.some((el) => !el.name.trim())) {
      setMsgKind('err');
      setMsg(elStr.errNames);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        elements: elements.map((el, ei) => ({
          ...(el.serverId ? { id: el.serverId } : {}),
          name: el.name.trim(),
          sortOrder: ei,
          availabilities: el.availabilities.map((a, ai) => ({
            brandMaterialColorId: a.brandMaterialColorId,
            sortOrder: ai,
          })),
        })),
      };
      await adminBackendJson<unknown>(
        `catalog/admin/products/${productId}/elements`,
        { method: 'PATCH', body: JSON.stringify(payload) },
      );
      const fresh = await adminBackendJson<ProductAdminDetail>(
        `catalog/admin/products/${productId}`,
      );
      const matched = elements.map((local, idx) => {
        const server = fresh.elements[idx];
        if (!server) return local;
        return {
          ...local,
          serverId: server.id,
          availabilities: server.availabilities.map(availabilityFromAdmin),
        };
      });
      setElements(matched);
      onProductMutated(fresh);
      await revalidatePublicCatalogCache();
      setMsgKind('ok');
      setMsg(elStr.saved);
    } catch (err) {
      setMsgKind('err');
      setMsg(err instanceof Error ? err.message : elStr.saveErr);
    } finally {
      setSaving(false);
    }
  }, [elements, productId, onProductMutated, elStr]);

  return (
    <div className={pn.section}>
      <BrandMaterialColorPickerModal
        open={pickerElementId !== null}
        brandId={brandId}
        preSelectedIds={pickerElement?.availabilities.map((a) => a.brandMaterialColorId) ?? []}
        title={elStr.pickerTitle(pickerElement?.name || elStr.elementFallback)}
        onClose={() => setPickerElementId(null)}
        onConfirm={(picked) => {
          if (pickerElementId) {
            setElements((prev) =>
              prev.map((el) =>
                el.id === pickerElementId
                  ? {
                      ...el,
                      availabilities: picked.map((p) => ({
                        brandMaterialColorId: p.brandMaterialColorId,
                        materialName: p.materialName,
                        colorName: p.colorName,
                        imageUrl: p.imageUrl,
                      })),
                    }
                  : el,
              ),
            );
          }
          setPickerElementId(null);
        }}
      />

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
          {elStr.sectionTitle}
        </h2>
        <button
          type="button"
          className={`${catalogStyles.btn} ${catalogStyles.btnPrimary}`}
          onClick={() => {
            void saveElements();
          }}
          disabled={saving}
        >
          {saving ? elStr.saveBusy : elStr.save}
        </button>
      </div>

      {elements.length === 0 ? (
        <p className={catalogStyles.muted}>
          {elStr.hintNoElements}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={elements.map((el) => el.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={pn.repeatList}>
              {elements.map((el) => (
                <SortableElementCard
                  key={el.id}
                  el={el}
                  strings={elStr}
                  onChange={(patch) => updateElement(el.id, patch)}
                  onRemove={() => removeElement(el.id)}
                  onOpenPicker={() => setPickerElementId(el.id)}
                  onRemoveAvailability={(bmcId) => removeAvailability(el.id, bmcId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className={catalogStyles.btn} onClick={addElement}>
          {elStr.addElement}
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
