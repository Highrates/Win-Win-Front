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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { MediaLibraryPickerModal } from '@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal';
import { createClientRandomId } from '@/lib/clientRandomId';
import type { adminProductGalleryEditorStrings } from '@/lib/admin-i18n/adminProductGalleryEditorI18n';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import styles from './ProductGalleryEditor.module.css';

export type ProductGalleryFrame = {
  id: string;
  url: string;
  serverId?: string;
};

type GalleryStrings = ReturnType<typeof adminProductGalleryEditorStrings>;

type SortableTileProps = {
  frame: ProductGalleryFrame;
  index: number;
  showCover: boolean;
  showOrder: boolean;
  strings: GalleryStrings;
  onRemove: () => void;
};

function SortableGalleryTile({
  frame,
  index,
  showCover,
  showOrder,
  strings,
  onRemove,
}: SortableTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: frame.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${styles.tile} ${isDragging ? styles.tileDragging : ''}`}
    >
      <img className={styles.thumb} src={frame.url} alt="" loading="lazy" />
      {showCover && index === 0 ? <span className={styles.coverBadge}>{strings.cover}</span> : null}
      {showOrder && index > 0 ? (
        <span className={styles.orderBadge}>{index + 1}</span>
      ) : null}
      <div className={styles.tileActions}>
        <button
          type="button"
          className={styles.dragBtn}
          {...attributes}
          {...listeners}
          aria-label={strings.dragAria}
        >
          ⋮⋮
        </button>
        <button
          type="button"
          className={styles.removeBtn}
          onClick={onRemove}
          aria-label={strings.removeFrameAria}
        />
      </div>
    </li>
  );
}

type FullProps = {
  mode: 'full';
  items: ProductGalleryFrame[];
  onChange: (items: ProductGalleryFrame[]) => void;
  strings: GalleryStrings;
  className?: string;
  /** Ограничение числа кадров (например, 3 у бренда). */
  maxItems?: number;
};

type SubsetProps = {
  mode: 'subset';
  pool: ProductGalleryFrame[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  strings: GalleryStrings;
  className?: string;
};

export type ProductGalleryEditorProps = FullProps | SubsetProps;

function newFrameId() {
  return createClientRandomId();
}

export function ProductGalleryEditor(props: ProductGalleryEditorProps) {
  const { strings, className } = props;
  const [pickerOpen, setPickerOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const isFull = props.mode === 'full';
  const maxItems = isFull ? props.maxItems : undefined;
  const atMaxItems = isFull && maxItems != null && props.items.length >= maxItems;

  const selectedFrames = useMemo(() => {
    if (isFull) return props.items;
    const byId = new Map(props.pool.map((f) => [f.id, f]));
    return props.selectedIds
      .map((id) => byId.get(id))
      .filter((f): f is ProductGalleryFrame => f != null);
  }, [isFull, props]);

  const sortableIds = useMemo(() => selectedFrames.map((f) => f.id), [selectedFrames]);

  const unselectedPool = useMemo(() => {
    if (isFull) return [];
    const selected = new Set(props.selectedIds);
    return props.pool.filter((f) => !selected.has(f.id));
  }, [isFull, props]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    if (isFull) {
      const oldIndex = props.items.findIndex((f) => f.id === active.id);
      const newIndex = props.items.findIndex((f) => f.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      props.onChange(arrayMove(props.items, oldIndex, newIndex));
      return;
    }

    const oldIndex = props.selectedIds.findIndex((id) => id === active.id);
    const newIndex = props.selectedIds.findIndex((id) => id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    props.onSelectedIdsChange(arrayMove(props.selectedIds, oldIndex, newIndex));
  }

  function removeFrame(id: string) {
    if (isFull) {
      props.onChange(props.items.filter((f) => f.id !== id));
      return;
    }
    props.onSelectedIdsChange(props.selectedIds.filter((x) => x !== id));
  }

  function addFromPool(id: string) {
    if (isFull) return;
    if (props.selectedIds.includes(id)) return;
    props.onSelectedIdsChange([...props.selectedIds, id]);
  }

  function handlePickBatch(items: { url: string; id: string }[]) {
    if (!isFull || !items.length) return;
    const room =
      maxItems != null ? Math.max(0, maxItems - props.items.length) : items.length;
    const picked = items.slice(0, room);
    if (!picked.length) {
      setPickerOpen(false);
      return;
    }
    props.onChange([
      ...props.items,
      ...picked.map((item) => ({
        id: newFrameId(),
        url: item.url,
      })),
    ]);
    setPickerOpen(false);
  }

  const count = selectedFrames.length;

  if (!isFull && props.pool.length === 0) {
    return (
      <div className={`${styles.root} ${className ?? ''}`.trim()}>
        <p className={`${catalogStyles.muted} ${styles.empty}`}>{strings.emptyPool}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${className ?? ''}`.trim()}>
      <div className={styles.metaRow}>
        {count > 0 ? <p className={styles.count}>{strings.framesCount(count)}</p> : <span />}
        {isFull && !atMaxItems ? (
          <AdminCompactBtn type="button" onClick={() => setPickerOpen(true)}>
            {strings.add}
          </AdminCompactBtn>
        ) : null}
      </div>

      {count === 0 && isFull ? (
        <ul className={styles.grid}>
          <li className={`${styles.tile} ${styles.tileAdd}`}>
            <button
              type="button"
              className={styles.addTile}
              onClick={() => setPickerOpen(true)}
              aria-label={strings.addFromLibraryAria}
            >
              <span className={styles.addIcon} aria-hidden>
                +
              </span>
            </button>
          </li>
        </ul>
      ) : count === 0 ? (
        <p className={`${catalogStyles.muted} ${styles.empty}`}>{strings.emptySelected}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <ul className={styles.grid}>
              {selectedFrames.map((frame, index) => (
                <SortableGalleryTile
                  key={frame.id}
                  frame={frame}
                  index={index}
                  showCover
                  showOrder={count > 1}
                  strings={strings}
                  onRemove={() => removeFrame(frame.id)}
                />
              ))}
              {isFull && !atMaxItems ? (
                <li className={`${styles.tile} ${styles.tileAdd}`}>
                  <button
                    type="button"
                    className={styles.addTile}
                    onClick={() => setPickerOpen(true)}
                    aria-label={strings.addFromLibraryAria}
                  >
                    <span className={styles.addIcon} aria-hidden>
                      +
                    </span>
                  </button>
                </li>
              ) : null}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {!isFull && unselectedPool.length > 0 ? (
        <div className={styles.poolSection}>
          <h3 className={`${catalogStyles.groupHeading} ${styles.poolHeading}`}>{strings.poolHeading}</h3>
          <p className={catalogStyles.muted} style={{ margin: 0 }}>
            {strings.poolHint}
          </p>
          <div className={styles.poolGrid}>
            {unselectedPool.map((frame) => (
              <button
                key={frame.id}
                type="button"
                className={styles.poolTile}
                onClick={() => addFromPool(frame.id)}
                aria-label={strings.addFrameAria}
              >
                <img className={styles.poolThumb} src={frame.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isFull && pickerOpen ? (
        <MediaLibraryPickerModal
          open
          title={strings.pickerTitle}
          mediaFilter="image"
          onClose={() => setPickerOpen(false)}
          onPickBatch={handlePickBatch}
        />
      ) : null}
    </div>
  );
}
