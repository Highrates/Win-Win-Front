import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminProductElementsStrings(locale: AdminLocale) {
  return {
    dragEl: pick(locale, 'Перетащить элемент', '拖动元素'),
    dragElAria: pick(locale, 'Перетащить элемент', '拖动元素'),
    namePh: pick(locale, 'Напр. Обивка', '例如：软包'),
    delete: pick(locale, 'Удалить', '删除'),
    poolLabel: pick(locale, 'Доступные «материал-цвета»:', '可选「材质-颜色」：'),
    pickFromBrand: pick(locale, 'Выбрать из библиотеки бренда', '从品牌库选择'),
    poolEmpty: pick(
      locale,
      'Ещё не выбрано. Кликните «Выбрать из библиотеки бренда», чтобы добавить.',
      '尚未选择。点击「从品牌库选择」添加。',
    ),
    removeFromElAria: pick(locale, 'Убрать из элемента', '从元素移除'),
    removeFromElTitle: pick(locale, 'Убрать из элемента', '从元素移除'),
    errNames: pick(locale, 'У всех элементов должно быть название', '每个元素都必须有名称'),
    saved: pick(locale, 'Элементы сохранены', '元素已保存'),
    saveErr: pick(locale, 'Ошибка сохранения элементов', '保存元素失败'),
    elementFallback: pick(locale, 'элемент', '元素'),
    pickerTitle: (name: string) =>
      pick(locale, `Материал-цвета для «${name}»`, `「${name}」的材质-颜色`),
    sectionTitle: pick(locale, 'Настраиваемые элементы', '可配置元素'),
    saveBusy: pick(locale, 'Сохранение…', '保存中…'),
    save: pick(locale, 'Сохранить элементы', '保存元素'),
    hintNoElements: pick(
      locale,
      'У товара ещё нет элементов. Для простого товара это нормально — достаточно только модификации. Для составного товара добавьте соответствующие элементы.',
      '商品尚无元素。简单商品只需修改即可；组合商品请添加对应元素。',
    ),
    addElement: pick(locale, '+ Элемент', '+ 元素'),
  };
}
