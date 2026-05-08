/** Ответы BFF `GET/PUT …/designer-projects/me/…` */

export type DesignerProjectRoomApi = {
  id: string;
  label: string;
  roomType: string;
  sortOrder: number;
};

export type DesignerProjectLineSnapshotApi = {
  productName?: string;
  modificationLabel?: string | null;
  elementMaterialRows?: { elementLabel: string; materialColorLabel: string }[];
  imageUrl?: string | null;
  /** ₽ за единицу из карточки каталога, если строка без варианта SKU */
  catalogPriceMinRub?: number;
  catalogPriceMaxRub?: number;
};

export type DesignerProjectLineApi = {
  id: string;
  roomId: string;
  productId: string;
  productSlug: string;
  productVariantId: string | null;
  quantity: number;
  unit: string;
  snapshot: DesignerProjectLineSnapshotApi | Record<string, unknown>;
  priceRubPerUnit: number | null;
  lineTotalRub: number | null;
  resolvedImageUrl: string | null;
  /** Основная категория товара в каталоге — для вкладок на странице проекта. */
  categoryId: string | null;
  categoryLabel: string | null;
};

export type DesignerProjectDetailApi = {
  id: string;
  name: string;
  address: string | null;
  updatedAt: string;
  totalRub: number;
  rooms: DesignerProjectRoomApi[];
  lines: DesignerProjectLineApi[];
};

export type DesignerProjectSummaryApi = {
  id: string;
  name: string;
  address: string | null;
  updatedAt: string;
  lineCount: number;
  roomCount: number;
  totalRub: number | null;
};

export type DesignerProjectListResponse = {
  projects: DesignerProjectSummaryApi[];
};

export type DesignerProjectRoomPayload = {
  key: string;
  label: string;
  roomType: string;
  sortOrder?: number;
};

export type DesignerProjectLinePayload = {
  roomKey: string;
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  unit?: string;
  snapshot?: Record<string, unknown>;
  sortOrder?: number;
};

export type SaveDesignerProjectPayload = {
  name: string;
  address?: string | null;
  rooms: DesignerProjectRoomPayload[];
  lines: DesignerProjectLinePayload[];
};
