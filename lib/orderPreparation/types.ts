export type OrderPreparationLineApi = {
  id: string;
  productId: string;
  productSlug: string;
  name: string;
  price: string;
  metaRows: { label: string; value: string }[];
  quantity: number;
  unit: string;
  productVariantId: string | null;
  imageUrl: string | null;
  priceRubPerUnit: number | null;
  lineTotalRub: number | null;
};

export type OrderPreparationDraftApi = {
  orderId: string;
  customerName: string;
  deliveryAddress: string;
  comment: string;
  totalRub: number;
  lines: OrderPreparationLineApi[];
};

export type AddOrderPreparationLineBody = {
  productId: string;
  productVariantId?: string | null;
  quantity?: number;
  unit?: string;
  snapshot?: Record<string, unknown>;
};
