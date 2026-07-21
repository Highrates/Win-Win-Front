import type { DesignerProjectListResponse, SaveDesignerProjectPayload } from '@/lib/designerProjects/apiTypes';
import { createDesignerProject, fetchDesignerProjectList } from '@/lib/designerProjects/clientApi';
import type { DesignerProjectStored } from '@/lib/designerProjects/types';

const LOCAL_KEY = 'winwin-designer-projects-v1';

function mapStoredToPayload(p: DesignerProjectStored): SaveDesignerProjectPayload {
  const rooms = p.rooms.map((r, i) => ({
    key: r.id,
    label: r.label,
    roomType: r.roomType,
    sortOrder: i,
  }));
  const lines = p.lines.map((l, i) => ({
    roomKey: l.roomId,
    productId: l.productId,
    productVariantId: l.variantId,
    quantity: typeof l.quantity === 'number' && Number.isFinite(l.quantity) ? l.quantity : 1,
    unit: typeof l.unit === 'string' && l.unit.trim() ? l.unit.trim() : 'шт',
    snapshot: {
      productName: l.productName,
      modificationLabel: l.modificationLabel,
      elementMaterialRows: l.elementMaterialRows,
      imageUrl: l.imageUrl,
    },
    sortOrder: i,
  }));
  return {
    name: p.name,
    address: p.address || null,
    rooms,
    lines,
  };
}

/**
 * Одноразовый импорт из старого localStorage после появления API.
 * Возвращает актуальный ответ `GET` списка, чтобы не дублировать запрос в bootstrap
 * (кроме сценария миграции: тогда после создания проектов нужен второй `fetchDesignerProjectList`).
 * При ошибке — `null`, вызывающий код делает свой `refreshList()`.
 */
export async function migrateLocalDesignerProjectsOnce(): Promise<DesignerProjectListResponse | null> {
  if (typeof window === 'undefined') return null;
  try {
    const listRes = await fetchDesignerProjectList();

    if (listRes.projects.length > 0) {
      window.localStorage.removeItem(LOCAL_KEY);
      return listRes;
    }

    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      return listRes;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.removeItem(LOCAL_KEY);
      return listRes;
    }

    for (const p of parsed as DesignerProjectStored[]) {
      try {
        await createDesignerProject(mapStoredToPayload(p));
      } catch {
        /* одна запись не должна блокировать остальные */
      }
    }
    window.localStorage.removeItem(LOCAL_KEY);
    return await fetchDesignerProjectList();
  } catch {
    return null;
  }
}
