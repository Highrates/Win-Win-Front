import type { DesignerProjectDetailApi } from './apiTypes';
import { DEFAULT_DESIGNER_ROOM_KEY } from './defaultRoom';
import type { PdpProjectDraftPayload } from './pdpDraft';

export function pdpDraftToLineSnapshot(draft: PdpProjectDraftPayload): Record<string, unknown> {
  const snap: Record<string, unknown> = {
    productName: draft.productName,
    modificationLabel: draft.modificationLabel,
    elementMaterialRows: draft.elementMaterialRows,
    imageUrl: draft.imageUrl ?? undefined,
  };
  const min = draft.catalogPriceMinRub;
  const max = draft.catalogPriceMaxRub;
  if (
    typeof min === 'number' &&
    typeof max === 'number' &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min > 0 &&
    max >= min
  ) {
    snap.catalogPriceMinRub = min;
    snap.catalogPriceMaxRub = max;
  }
  return snap;
}

/** Одна строка помещения для сохранения на бэкенд (пользователь помещения не задаёт). */
export const DEFAULT_DESIGNER_ROOM_ROW = {
  key: DEFAULT_DESIGNER_ROOM_KEY,
  label: 'Проект',
  roomType: '—',
  sortOrder: 0,
} as const;

/** Сохранение: помещение одно; строки привязаны к нему на сервере. */
export function detailToSavePayload(detail: DesignerProjectDetailApi): import('./apiTypes').SaveDesignerProjectPayload {
  return {
    name: detail.name.trim(),
    address: detail.address?.trim() || null,
    rooms: [{ ...DEFAULT_DESIGNER_ROOM_ROW }],
    lines: detail.lines.map((l, i) => ({
      roomKey: DEFAULT_DESIGNER_ROOM_KEY,
      productId: l.productId,
      productVariantId: l.productVariantId,
      quantity: l.quantity,
      unit: l.unit,
      snapshot: (l.snapshot ?? {}) as Record<string, unknown>,
      sortOrder: i,
    })),
  };
}

export type ModalRoomDraft = {
  key: string;
  label: string;
  roomType: string;
  sortOrder: number;
};

export type ModalLineDraft = {
  clientLineId: string;
  roomKey: string;
  productId: string;
  productSlug: string;
  productVariantId: string | null;
  quantity: number;
  unit: string;
  snapshot: Record<string, unknown>;
};

export function detailToModalDraft(detail: DesignerProjectDetailApi): {
  name: string;
  address: string;
  rooms: ModalRoomDraft[];
  lines: ModalLineDraft[];
} {
  return {
    name: detail.name,
    address: detail.address ?? '',
    rooms: [{ ...DEFAULT_DESIGNER_ROOM_ROW }],
    lines: detail.lines.map((l) => ({
      clientLineId: l.id,
      roomKey: DEFAULT_DESIGNER_ROOM_KEY,
      productId: l.productId,
      productSlug: l.productSlug,
      productVariantId: l.productVariantId,
      quantity: l.quantity,
      unit: l.unit,
      snapshot: (l.snapshot ?? {}) as Record<string, unknown>,
    })),
  };
}

export function modalDraftToSavePayload(
  name: string,
  address: string,
  rooms: ModalRoomDraft[],
  lines: ModalLineDraft[],
): import('./apiTypes').SaveDesignerProjectPayload {
  return {
    name: name.trim(),
    address: address.trim() || null,
    rooms: rooms.map((r, i) => ({
      key: r.key,
      label: r.label.trim(),
      roomType: r.roomType.trim(),
      sortOrder: r.sortOrder ?? i,
    })),
    lines: lines.map((l, i) => ({
      roomKey: DEFAULT_DESIGNER_ROOM_KEY,
      productId: l.productId,
      productVariantId: l.productVariantId,
      quantity: l.quantity,
      unit: l.unit,
      snapshot: l.snapshot,
      sortOrder: i,
    })),
  };
}

/** Добавить строку из черновика PDP к существующему проекту (без лишнего round-trip по строкам). */
export function savePayloadWithAppendedPdpLine(
  detail: DesignerProjectDetailApi,
  draft: PdpProjectDraftPayload,
): import('./apiTypes').SaveDesignerProjectPayload {
  const base = detailToSavePayload(detail);
  base.lines.push({
    roomKey: DEFAULT_DESIGNER_ROOM_KEY,
    productId: draft.productId,
    productVariantId: draft.variantId,
    quantity: 1,
    unit: 'шт',
    snapshot: pdpDraftToLineSnapshot(draft),
    sortOrder: base.lines.length,
  });
  return base;
}
