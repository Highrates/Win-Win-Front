import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminProductPickerStrings(locale: AdminLocale) {
  return {
    title: pick(locale, 'Добавить товар', '添加商品'),
    close: pick(locale, 'Закрыть', '关闭'),
    searchPh: pick(locale, 'Поиск по названию или slug…', '按名称或 slug 搜索…'),
    searchAria: pick(locale, 'Поиск товаров', '搜索商品'),
    nothing: pick(locale, 'Ничего не найдено.', '未找到结果。'),
    selectAllPage: pick(locale, 'Выбрать все на странице', '全选本页'),
    selectRow: (name: string) => pick(locale, `Выбрать ${name}`, `选择 ${name}`),
    thName: pick(locale, 'Название', '名称'),
    thCategory: pick(locale, 'Категория', '分类'),
    thPrice: pick(locale, 'Цена', '价格'),
    allCats: pick(locale, 'Все категории', '全部分类'),
    catsAria: pick(locale, 'Категории', '分类'),
    catsErr: pick(locale, 'Не удалось загрузить категории.', '分类加载失败。'),
    retry: pick(locale, 'Повторить', '重试'),
    selected: (n: number) => pick(locale, `Выбрано: ${n}`, `已选：${n}`),
    hint: pick(
      locale,
      'Выберите товары по категории или через поиск',
      '可按分类或搜索选择商品',
    ),
    clearSel: pick(locale, 'Снять выбор', '取消选择'),
    addSelected: pick(locale, 'Добавить выбранные', '添加所选'),
    hidden: pick(locale, 'Скрыто', '已隐藏'),
    alreadyInDefault: pick(locale, 'Уже добавлен', '已添加'),
  };
}
