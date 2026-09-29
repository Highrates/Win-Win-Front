import type { ProjectProduct } from './[slug]/MoreAboutProjectModal';

export type ProjectDesignerLink = {
  name: string;
  slug: string;
  avatarSrc: string;
};

export type ProjectData = {
  /** Стабильный ключ списка/сетки (id кейса) */
  id?: string;
  title: string;
  places: string;
  /** Типы помещений из кейса (для фильтра на /projects) */
  roomTypes?: string[];
  description: string;
  /** HTML описания кейса (RichBlock) для модалки */
  descriptionHtml?: string | null;
  products: ProjectProduct[];
  coverImage: string;
  /** Second image for grid block (optional) */
  coverImage2?: string;
  /** Обложка для вида «сетка» (только кейсы; обычно первая из обложек) */
  gridCoverImage?: string;
  /** Ссылка на дизайнера (страница проектов и т.п.) */
  designer?: ProjectDesignerLink;
  /** Публичный счётчик лайков кейса */
  likesDisplayCount: number;
};

export type CasesPagination =
  | { mode: 'designer'; designerSlug: string; total: number; pageSize: number }
  | { mode: 'public'; productId?: string | null; total: number; pageSize: number };

export type ProductFilterTab = 'all' | 'with-products';

export const PRODUCT_FILTER_TABS: { id: ProductFilterTab; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'with-products', label: 'С товарами' },
];

/** Чередование пропорций обложек в сетке (по глобальному индексу, не по колонке). */
export const GRID_CARD_ASPECTS = [
  '3 / 4',
  '4 / 5',
  '1 / 1',
  '2 / 3',
  '4 / 5',
  '3 / 4',
  '2 / 3',
  '3 / 5',
] as const;
