/** Локальные проекты дизайнера (до API бэка). */

export type DesignerProjectRoomInstance = {
  id: string;
  /** Подпись во вкладках: «Гостиная», «Гостиная 2», … */
  label: string;
  /** Значение из настроек сайта (`caseRoomTypeOptions`). */
  roomType: string;
};

export type DesignerProjectLineItem = {
  id: string;
  roomId: string;
  productId: string;
  productSlug: string;
  productName: string;
  /** Полная конфигурация SKU; `null` если товар добавлен только из каталога. */
  variantId: string | null;
  modificationLabel: string | null;
  /** Строки «материал — цвет» по элементам (подпись элемента → значение). */
  elementMaterialRows: { elementLabel: string; materialColorLabel: string }[];
  /** Числовая цена в рублях для суммы (из варианта или из поиска). */
  priceRub: number | null;
  /** Диапазон цен каталога за единицу товара, если позиция без сопоставленного SKU (как на PDP). */
  catalogPriceMinRub?: number | null;
  catalogPriceMaxRub?: number | null;
  imageUrl: string | null;
  quantity?: number;
  unit?: string;
};

export type DesignerProjectStored = {
  id: string;
  name: string;
  address: string;
  rooms: DesignerProjectRoomInstance[];
  lines: DesignerProjectLineItem[];
  updatedAt: string;
};
