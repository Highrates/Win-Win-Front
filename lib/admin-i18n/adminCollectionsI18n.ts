import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminCollectionsPageShell(locale: AdminLocale) {
  return {
    title: pick(locale, 'Коллекции', '集合'),
    lead: pick(
      locale,
      'Редакторские подборки товаров или брендов для витрины.',
      '用于前台的商品或品牌精选。',
    ),
  };
}

export function adminCollectionsListStrings(locale: AdminLocale) {
  return {
    kindProduct: pick(locale, 'Товары', '商品'),
    kindBrand: pick(locale, 'Бренды', '品牌'),
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    confirmDelete: (n: number) =>
      pick(locale, `Удалить выбранные коллекции (${n})?`, `删除所选 ${n} 个集合？`),
    errDelete: pick(locale, 'Ошибка удаления', '删除失败'),
    searchPh: pick(locale, 'Поиск по названию…', '按名称搜索…'),
    searchAria: pick(locale, 'Поиск коллекций', '搜索集合'),
    add: pick(locale, 'Добавить коллекцию', '添加集合'),
    bulkAria: pick(locale, 'Массовые операции', '批量操作'),
    selectAll: pick(locale, 'Выбрать все', '全选'),
    clear: pick(locale, 'Снять выбор', '取消选择'),
    delete: (n: number) => pick(locale, `Удалить (${n})`, `删除 (${n})`),
    deleting: pick(locale, 'Удаление…', '删除中…'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Коллекций не найдено.', '未找到集合。'),
    selectAllAria: pick(locale, 'Выбрать все коллекции', '全选集合'),
    thName: pick(locale, 'Название коллекции', '集合名称'),
    thType: pick(locale, 'Тип', '类型'),
    thCount: pick(locale, 'Кол-во позиций', '条目数'),
    thVis: pick(locale, 'Доступность', '可见性'),
    selectOne: (name: string) => pick(locale, `Выбрать ${name}`, `选择 ${name}`),
    inCatalog: pick(locale, 'В каталоге', '目录中'),
    hidden: pick(locale, 'Скрыта', '已隐藏'),
  };
}

export function adminCollectionEditorStrings(locale: AdminLocale) {
  return {
    drag: pick(locale, 'Перетащить', '拖动'),
    remove: pick(locale, 'Убрать', '移除'),
    errLoad: pick(locale, 'Не удалось загрузить', '加载失败'),
    changeKindConfirm: pick(
      locale,
      'Сменить тип коллекции? Текущий список позиций будет очищен.',
      '更改集合类型？当前条目列表将被清空。',
    ),
    nameRequired: pick(locale, 'Укажите название', '请填写名称'),
    saveErr: pick(locale, 'Ошибка сохранения', '保存失败'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    backList: pick(locale, '← К списку коллекций', '← 返回集合列表'),
    coverTitle: pick(locale, 'Обложка коллекции', '集合封面'),
    addProductAria: pick(locale, 'Добавить товар', '添加商品'),
    addBrandAria: pick(locale, 'Добавить бренд', '添加品牌'),
    addProduct: pick(locale, 'Добавить товар', '添加商品'),
    addBrand: pick(locale, 'Добавить бренд', '添加品牌'),
    close: pick(locale, 'Закрыть', '关闭'),
    searchPh: pick(locale, 'Поиск…', '搜索…'),
    searchAria: pick(locale, 'Поиск', '搜索'),
    nothing: pick(locale, 'Ничего не найдено.', '未找到结果。'),
    selectAllList: pick(locale, 'Выбрать все в списке', '全选列表'),
    selectRow: (name: string) => pick(locale, `Выбрать ${name}`, `选择 ${name}`),
    thName: pick(locale, 'Название', '名称'),
    inCollection: pick(locale, '— в коллекции', '— 已在集合'),
    clearSel: pick(locale, 'Снять выбор', '取消选择'),
    addSelected: pick(locale, 'Добавить выбранные', '添加所选'),
    titleEdit: pick(locale, 'Редактирование коллекции', '编辑集合'),
    titleNew: pick(locale, 'Новая коллекция', '新建集合'),
    nameLabel: pick(locale, 'Название коллекции', '集合名称'),
    slugLabel: pick(locale, 'Slug (необязательно)', 'Slug（可选）'),
    slugPh: pick(locale, 'из названия', '由名称生成'),
    desc: pick(locale, 'Описание', '描述'),
    contentTitle: pick(locale, 'Содержимое коллекции', '集合内容'),
    tabProducts: pick(locale, 'Товары', '商品'),
    tabBrands: pick(locale, 'Бренды', '品牌'),
    coverBlock: pick(locale, 'Обложка коллекции', '集合封面'),
    pickLibrary: pick(locale, 'Выбрать из медиатеки', '从媒体库选择'),
    removeCover: pick(locale, 'Убрать обложку', '移除封面'),
    activeAria: pick(locale, 'Доступна на витрине', '在前台可见'),
    activeLabel: pick(locale, 'Доступна на витрине', '在前台可见'),
    listProducts: pick(locale, 'Товары в коллекции', '集合中的商品'),
    listBrands: pick(locale, 'Бренды в коллекции', '集合中的品牌'),
    addProductBtn: pick(locale, '+ Добавить товар', '+ 添加商品'),
    addBrandBtn: pick(locale, '+ Добавить бренд', '+ 添加品牌'),
    thOrder: pick(locale, 'Порядок', '顺序'),
    emptyPositions: pick(locale, 'Позиций пока нет.', '暂无条目。'),
    saveBusy: pick(locale, 'Сохранение…', '保存中…'),
    saveEdit: pick(locale, 'Сохранить', '保存'),
    create: pick(locale, 'Создать коллекцию', '创建集合'),
    cancel: pick(locale, 'Отмена', '取消'),
  };
}
