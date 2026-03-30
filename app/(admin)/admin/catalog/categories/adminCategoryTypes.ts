/**
 * Строка списка категорий в админке — соответствует ответу
 * `GET /api/.../catalog/admin/categories` (через прокси).
 */
export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  parent: { id: string; name: string } | null;
  _count: { products: number; children: number };
  recursiveProductCount: number;
};
