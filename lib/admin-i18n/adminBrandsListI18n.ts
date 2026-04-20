import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminBrandsListStrings(locale: AdminLocale) {
  return {
    searchPlaceholder: pick(locale, 'Поиск по названию…', '按名称搜索…'),
    searchAria: pick(locale, 'Поиск брендов', '搜索品牌'),
    addBrand: pick(locale, 'Добавить бренд', '添加品牌'),
    bulkAria: pick(locale, 'Массовые операции', '批量操作'),
    selectAll: pick(locale, 'Выбрать все', '全选'),
    clearSelection: pick(locale, 'Снять выбор', '取消选择'),
    deleteWithCount: (n: number) =>
      pick(locale, `Удалить (${n})`, `删除 (${n})`),
    deleteBusy: pick(locale, 'Удаление…', '删除中…'),
    confirmDelete: (n: number) =>
      pick(
        locale,
        `Удалить выбранные бренды (${n})? У брендов с товарами удаление будет пропущено.`,
        `删除所选 ${n} 个品牌？有商品的品牌将跳过。`,
      ),
    partialDelete: (skipped: number, deleted: number) =>
      pick(
        locale,
        `Не удалено ${skipped} брендов (есть товары). Удалено без товаров: ${deleted}.`,
        `有 ${skipped} 个品牌因含商品未删除；已删除无商品：${deleted}。`,
      ),
    empty: pick(locale, 'Бренды не найдены.', '未找到品牌。'),
    colName: pick(locale, 'Название бренда', '品牌名称'),
    colProducts: pick(locale, 'Товары', '商品'),
    colVisibility: pick(locale, 'Доступность', '可见性'),
    selectAllBrandsAria: pick(locale, 'Выбрать все бренды', '全选品牌'),
    selectBrandAria: (name: string) =>
      pick(locale, `Выбрать бренд «${name}»`, `选择品牌「${name}」`),
    published: pick(locale, 'Опубликован', '已发布'),
    hidden: pick(locale, 'Скрыт', '已隐藏'),
  };
}
