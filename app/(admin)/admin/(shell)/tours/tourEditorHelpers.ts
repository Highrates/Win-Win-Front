import type { ProductGalleryFrame } from '@/components/admin/ProductGalleryEditor/ProductGalleryEditor';
import { createClientRandomId } from '@/lib/clientRandomId';
import type {
  AdminChinaTourDay,
  AdminChinaTourImage,
  AdminChinaTourScheduleItem,
  ChinaTourImageRole,
} from './toursAdminTypes';

export type EditorItem = AdminChinaTourScheduleItem & { clientKey: string };

export type EditorDay = Omit<AdminChinaTourDay, 'items'> & {
  clientKey: string;
  items: EditorItem[];
};

export function emptyScheduleItem(): EditorItem {
  return {
    timeLabel: '',
    title: '',
    body: '',
    clientKey: createClientRandomId(),
  };
}

export function emptyDay(n: number): EditorDay {
  return {
    dayNumber: n,
    title: '',
    subtitle: '',
    sortOrder: n - 1,
    items: [emptyScheduleItem()],
    images: [],
    clientKey: createClientRandomId(),
  };
}

export function hydrateEditorItem(it: AdminChinaTourScheduleItem): EditorItem {
  return {
    ...it,
    clientKey: it.id ?? createClientRandomId(),
  };
}

export function hydrateEditorDay(d: AdminChinaTourDay): EditorDay {
  const items = d.items.length ? d.items.map(hydrateEditorItem) : [emptyScheduleItem()];
  return {
    ...d,
    clientKey: d.id ?? createClientRandomId(),
    items,
    images: d.images ?? [],
  };
}

export function hydrateEditorDays(days: AdminChinaTourDay[]): EditorDay[] {
  return days.map(hydrateEditorDay);
}

export function toDateInput(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function imagesToFrames(images: AdminChinaTourImage[]): ProductGalleryFrame[] {
  return [...images]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => ({
      id: img.id ?? createClientRandomId(),
      url: img.url,
      serverId: img.id,
    }));
}

export function cardFramesToImages(frames: ProductGalleryFrame[]): AdminChinaTourImage[] {
  return frames.map((f, i) => ({
    url: f.url,
    role: (i === 0 ? 'CARD_PRIMARY' : 'CARD_SECONDARY') as ChinaTourImageRole,
    sortOrder: i,
    id: f.serverId,
  }));
}

export function selectedFramesToDayImages(
  pool: ProductGalleryFrame[],
  selectedIds: string[],
): AdminChinaTourImage[] {
  const byId = new Map(pool.map((f) => [f.id, f]));
  return selectedIds
    .map((id) => byId.get(id))
    .filter((f): f is ProductGalleryFrame => Boolean(f))
    .map((f, i) => ({
      url: f.url,
      role: (i === 0 ? 'DAY_HERO' : 'DAY_GALLERY') as ChinaTourImageRole,
      sortOrder: i,
      id: f.serverId,
    }));
}

export function matchDaySelectedIds(
  dayImages: AdminChinaTourImage[],
  pool: ProductGalleryFrame[],
): string[] {
  const used = new Set<string>();
  const ids: string[] = [];
  for (const img of [...dayImages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))) {
    const match = pool.find((f) => f.url === img.url && !used.has(f.id));
    if (!match) continue;
    used.add(match.id);
    ids.push(match.id);
  }
  return ids;
}

/** Разрешает пустое поле при наборе; на сохранении — целые ≥ 0. */
export function parseSeatCount(raw: string, fallback: number): number {
  const t = raw.trim();
  if (!t) return fallback;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

export function sanitizeSeatDraft(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

export function parseTourDateInput(raw: string, fieldLabel: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error(`Укажите дату: ${fieldLabel.toLowerCase()}`);
  const d = new Date(`${trimmed}T12:00:00.000Z`);
  if (!Number.isFinite(d.getTime())) {
    throw new Error(`Некорректная дата: ${fieldLabel.toLowerCase()}`);
  }
  return d.toISOString();
}

export function humanizeTourSaveError(e: unknown): string {
  const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
  if (/invalid date|invalid time value/i.test(msg)) {
    return 'Укажите корректные даты начала и окончания';
  }
  if (/must be a valid iso 8601 date string/i.test(msg)) {
    return 'Укажите корректные даты начала и окончания';
  }
  return msg;
}