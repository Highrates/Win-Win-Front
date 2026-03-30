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
import { useCallback } from 'react';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import styles from '../../catalogAdmin.module.css';

export type SubcatRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count: { products: number; children: number };
};

function SortableSubRow({ row }: { row: SubcatRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
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
        <Link href={`/admin/catalog/categories/${row.id}`}>{row.name}</Link>
      </td>
      <td>{row._count.products}</td>
      <td>{row._count.children}</td>
    </tr>
  );
}

export function SubcategoriesDnD({
  parentCategoryId,
  items,
  onUpdated,
}: {
  parentCategoryId: string;
  items: SubcatRow[];
  onUpdated: () => void | Promise<void>;
}) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((r) => r.id === active.id);
      const newIndex = items.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(items, oldIndex, newIndex);
      try {
        await adminBackendJson('catalog/admin/categories/reorder', {
          method: 'POST',
          body: JSON.stringify({ parentId: parentCategoryId, orderedIds: next.map((r) => r.id) }),
        });
        await revalidatePublicCatalogCache();
        router.refresh();
        await onUpdated();
      } catch {
        await onUpdated();
      }
    },
    [items, parentCategoryId, onUpdated, router]
  );

  const ids = items.map((r) => r.id);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 36 }} aria-label="Порядок" />
              <th>Название</th>
              <th>Товаров</th>
              <th>Подкатегорий</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {items.map((row) => (
                <SortableSubRow key={row.id} row={row} />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
}
