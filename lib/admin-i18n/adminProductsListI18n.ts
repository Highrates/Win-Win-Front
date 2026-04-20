import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminProductsListStrings(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    confirmDelete: (n: number) =>
      pick(
        locale,
        `Удалить выбранные товары (${n})? Товары, которые уже есть в заказах, удалены не будут.`,
        `删除所选 ${n} 个商品？已在订单中的商品不会被删除。`,
      ),
    partialDelete: (skipped: number, deleted: number) =>
      pick(
        locale,
        `Не удалено ${skipped} товаров (есть в заказах или ошибка). Удалено: ${deleted}.`,
        `有 ${skipped} 个商品因订单等原因未删。已删：${deleted}。`,
      ),
    errDelete: pick(locale, 'Ошибка удаления', '删除失败'),
    searchPh: pick(locale, 'Поиск по названию или slug…', '按名称或 slug 搜索…'),
    searchAria: pick(locale, 'Поиск товаров', '搜索商品'),
    add: pick(locale, 'Добавить товар', '添加商品'),
    bulkAria: pick(locale, 'Массовые операции', '批量操作'),
    selectAll: pick(locale, 'Выбрать все', '全选'),
    clear: pick(locale, 'Снять выбор', '取消选择'),
    delete: (n: number) => pick(locale, `Удалить (${n})`, `删除 (${n})`),
    deleting: pick(locale, 'Удаление…', '删除中…'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Товары не найдены.', '未找到商品。'),
    thPreview: pick(locale, 'Превью', '预览'),
    selectAllProducts: pick(locale, 'Выбрать все товары', '全选商品'),
    thName: pick(locale, 'Название товара', '商品名称'),
    thCategory: pick(locale, 'Категория', '类别'),
    thPrice: pick(locale, 'Цена', '价格'),
    thVis: pick(locale, 'Доступность', '可见性'),
    selectOne: (name: string) => pick(locale, `Выбрать «${name}»`, `选择「${name}」`),
    inCatalog: pick(locale, 'В каталоге', '目录中'),
    hidden: pick(locale, 'Скрыт', '已隐藏'),
  };
}
