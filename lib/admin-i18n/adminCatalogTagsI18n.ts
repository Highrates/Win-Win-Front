import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminCatalogTagsPageShell(locale: AdminLocale) {
  return {
    title: pick(locale, 'Контекстные теги', '上下文标签'),
  };
}

export function adminCatalogTagsListStrings(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    errReorder: pick(locale, 'Не удалось сохранить порядок', '无法保存排序'),
    searchReorderHint: pick(
      locale,
      'При активном поиске порядок тегов менять нельзя — очистите поле поиска.',
      '搜索时无法调整顺序，请清空搜索框。',
    ),
    drag: pick(locale, 'Перетащить', '拖动'),
    thOrder: pick(locale, 'Порядок', '顺序'),
    confirmDelete: (n: number) =>
      pick(locale, `Удалить выбранные теги (${n})?`, `删除所选 ${n} 个标签？`),
    errDelete: pick(locale, 'Ошибка удаления', '删除失败'),
    searchPh: pick(locale, 'Поиск по названию или slug…', '按名称或 slug 搜索…'),
    searchAria: pick(locale, 'Поиск тегов', '搜索标签'),
    add: pick(locale, 'Добавить тег', '添加标签'),
    bulkAria: pick(locale, 'Массовые операции', '批量操作'),
    selectAll: pick(locale, 'Выбрать все', '全选'),
    clear: pick(locale, 'Снять выбор', '取消选择'),
    delete: (n: number) => pick(locale, `Удалить (${n})`, `删除 (${n})`),
    deleting: pick(locale, 'Удаление…', '删除中…'),
    empty: pick(locale, 'Теги не найдены.', '未找到标签。'),
    selectAllAria: pick(locale, 'Выбрать все теги', '全选标签'),
    thName: pick(locale, 'Название', '名称'),
    thSlug: pick(locale, 'Slug', 'Slug'),
    thCount: pick(locale, 'Товаров', '商品数'),
    selectOne: (name: string) => pick(locale, `Выбрать «${name}»`, `选择「${name}」`),
  };
}

export function adminCatalogTagEditorStrings(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Не удалось загрузить', '加载失败'),
    nameRequired: pick(locale, 'Укажите название', '请填写名称'),
    saveErr: pick(locale, 'Ошибка сохранения', '保存失败'),
    backList: pick(locale, '← К списку тегов', '← 返回标签列表'),
    addProductAria: pick(locale, 'Добавить товар', '添加商品'),
    addProduct: pick(locale, 'Добавить товар', '添加商品'),
    close: pick(locale, 'Закрыть', '关闭'),
    searchPh: pick(locale, 'Поиск…', '搜索…'),
    searchAria: pick(locale, 'Поиск', '搜索'),
    nothing: pick(locale, 'Ничего не найдено.', '未找到结果。'),
    selectAllList: pick(locale, 'Выбрать все в списке', '全选列表'),
    selectRow: (name: string) => pick(locale, `Выбрать ${name}`, `选择 ${name}`),
    thName: pick(locale, 'Название', '名称'),
    inTag: pick(locale, '— в теге', '— 已在标签中'),
    clearSel: pick(locale, 'Снять выбор', '取消选择'),
    addSelected: pick(locale, 'Добавить выбранные', '添加所选'),
    titleEdit: pick(locale, 'Редактирование тега', '编辑标签'),
    titleNew: pick(locale, 'Новый контекстный тег', '新建上下文标签'),
    nameLabel: pick(locale, 'Название', '名称'),
    slugLabel: pick(locale, 'Slug (необязательно)', 'Slug（可选）'),
    slugPh: pick(locale, 'из названия', '由名称生成'),
    contentTitle: pick(locale, 'Товары с этим тегом', '此标签下的商品'),
    remove: pick(locale, 'Убрать', '移除'),
    save: pick(locale, 'Сохранить', '保存'),
    saving: pick(locale, 'Сохранение…', '保存中…'),
  };
}
