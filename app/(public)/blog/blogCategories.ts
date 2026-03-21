export const BLOG_CATEGORIES = [
  { id: 'all', label: 'Все статьи' },
  { id: 'events', label: 'События' },
  { id: 'brands', label: 'Бренды' },
  { id: 'interviews', label: 'Интервью' },
  { id: 'guides', label: 'Гиды' },
] as const;

export type BlogCategoryId = (typeof BLOG_CATEGORIES)[number]['id'];

/** Рубрика статьи (без «Все статьи») */
export type BlogPostCategory = Exclude<BlogCategoryId, 'all'>;
