import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminProductSetsPageShell(locale: AdminLocale) {
  return {
    title: pick(locale, 'Наборы', '套装'),
    lead: pick(
      locale,
      'Редакторские подборки только из товаров для витрины.',
      '仅含商品的编辑精选，用于前台。',
    ),
  };
}

export function adminProductSetsListStrings(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    confirmDelete: (n: number) => pick(locale, `Удалить выбранные наборы (${n})?`, `删除所选 ${n} 个套装？`),
    errDelete: pick(locale, 'Ошибка удаления', '删除失败'),
    searchPh: pick(locale, 'Поиск по названию…', '按名称搜索…'),
    searchAria: pick(locale, 'Поиск наборов', '搜索套装'),
    add: pick(locale, 'Добавить набор', '添加套装'),
    bulkAria: pick(locale, 'Массовые операции', '批量操作'),
    selectAll: pick(locale, 'Выбрать все', '全选'),
    clear: pick(locale, 'Снять выбор', '取消选择'),
    delete: (n: number) => pick(locale, `Удалить (${n})`, `删除 (${n})`),
    deleting: pick(locale, 'Удаление…', '删除中…'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Наборов не найдено.', '未找到套装。'),
    selectAllAria: pick(locale, 'Выбрать все наборы', '全选套装'),
    thName: pick(locale, 'Название набора', '套装名称'),
    thCount: pick(locale, 'Кол-во позиций', '条目数'),
    thVis: pick(locale, 'Доступность', '可见性'),
    selectOne: (name: string) => pick(locale, `Выбрать ${name}`, `选择 ${name}`),
    inCatalog: pick(locale, 'В каталоге', '目录中'),
    hidden: pick(locale, 'Скрыт', '已隐藏'),
  };
}

export function adminProductSetEditorStrings(locale: AdminLocale) {
  return {
    drag: pick(locale, 'Перетащить', '拖动'),
    remove: pick(locale, 'Убрать', '移除'),
    errLoad: pick(locale, 'Не удалось загрузить', '加载失败'),
    nameRequired: pick(locale, 'Укажите название', '请填写名称'),
    saveErr: pick(locale, 'Ошибка сохранения', '保存失败'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    backList: pick(locale, '← К списку наборов', '← 返回套装列表'),
    coverTitle: pick(locale, 'Обложка набора', '套装封面'),
    addProductAria: pick(locale, 'Добавить товар', '添加商品'),
    addProduct: pick(locale, 'Добавить товар', '添加商品'),
    close: pick(locale, 'Закрыть', '关闭'),
    searchPh: pick(locale, 'Поиск…', '搜索…'),
    searchAria: pick(locale, 'Поиск', '搜索'),
    nothing: pick(locale, 'Ничего не найдено.', '未找到结果。'),
    selectAllList: pick(locale, 'Выбрать все в списке', '全选列表'),
    selectRow: (name: string) => pick(locale, `Выбрать ${name}`, `选择 ${name}`),
    thName: pick(locale, 'Название', '名称'),
    inSet: pick(locale, '— в наборе', '— 已在套装'),
    clearSel: pick(locale, 'Снять выбор', '取消选择'),
    addSelected: pick(locale, 'Добавить выбранные', '添加所选'),
    titleEdit: pick(locale, 'Редактирование набора', '编辑套装'),
    titleNew: pick(locale, 'Новый набор', '新建套装'),
    nameLabel: pick(locale, 'Название набора', '套装名称'),
    slugLabel: pick(locale, 'Slug (необязательно)', 'Slug（可选）'),
    slugPh: pick(locale, 'из названия', '由名称生成'),
    desc: pick(locale, 'Описание', '描述'),
    coverBlock: pick(locale, 'Обложка набора', '套装封面'),
    pickLibrary: pick(locale, 'Выбрать из медиатеки', '从媒体库选择'),
    removeCover: pick(locale, 'Убрать обложку', '移除封面'),
    brand: pick(locale, 'Бренд', '品牌'),
    brandAria: pick(locale, 'Бренд набора', '套装品牌'),
    brandNone: pick(locale, '— Не выбран —', '— 未选择 —'),
    activeAria: pick(locale, 'Доступен на витрине', '在前台可见'),
    activeLabel: pick(locale, 'Доступен на витрине', '在前台可见'),
    productsTitle: pick(locale, 'Товары в наборе', '套装中的商品'),
    addProductBtn: pick(locale, '+ Добавить товар', '+ 添加商品'),
    thOrder: pick(locale, 'Порядок', '顺序'),
    emptyPositions: pick(locale, 'Позиций пока нет.', '暂无条目。'),
    saveBusy: pick(locale, 'Сохранение…', '保存中…'),
    saveEdit: pick(locale, 'Сохранить', '保存'),
    create: pick(locale, 'Создать набор', '创建套装'),
    cancel: pick(locale, 'Отмена', '取消'),
  };
}
