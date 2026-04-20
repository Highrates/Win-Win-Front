import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminCategoriesListStrings(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    errReorder: pick(locale, 'Не удалось сохранить порядок', '无法保存排序'),
    confirmDelete: (n: number) =>
      pick(
        locale,
        `Удалить выбранные категории (${n})? Сначала удалятся пустые листья, затем освободившиеся родители. Категории с товарами или не выбранными дочерними ветками останутся.`,
        `删除所选 ${n} 个类别？将先删空叶子，再删已空的父级。含商品或未选子树的类别将保留。`,
      ),
    partialDelete: (skipped: number, deleted: number) =>
      pick(
        locale,
        `Не удалено ${skipped} категорий (есть товары или дочерние категории вне выбора). Удалено: ${deleted}.`,
        `有 ${skipped} 个类别因含商品或子类别未选而未删。已删：${deleted}。`,
      ),
    errDelete: pick(locale, 'Ошибка удаления', '删除失败'),
    searchPh: pick(locale, 'Поиск по названию…', '按名称搜索…'),
    searchAria: pick(locale, 'Поиск категорий', '搜索类别'),
    create: pick(locale, 'Создать категорию', '创建类别'),
    bulkAria: pick(locale, 'Массовые операции', '批量操作'),
    selectAll: pick(locale, 'Выбрать все', '全选'),
    clear: pick(locale, 'Снять выбор', '取消选择'),
    delete: (n: number) => pick(locale, `Удалить (${n})`, `删除 (${n})`),
    deleting: pick(locale, 'Удаление…', '删除中…'),
    searchReorderHint: pick(
      locale,
      'При активном поиске порядок перетаскиванием отключён.',
      '搜索开启时无法拖拽排序。',
    ),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Категории не найдены.', '未找到类别。'),
    rootHeading: pick(locale, 'Корневые категории', '根类别'),
    subHeading: pick(locale, 'Подкатегории', '子类别'),
    selectAllRootAria: pick(locale, 'Выбрать все корневые категории', '全选根类别'),
    selectAllSubAria: pick(locale, 'Выбрать все подкатегории', '全选子类别'),
  };
}

export function adminCategoryTableStrings(locale: AdminLocale) {
  return {
    drag: pick(locale, 'Перетащить', '拖动'),
    selectCat: (name: string) => pick(locale, `Выбрать категорию «${name}»`, `选择类别「${name}」`),
    directTitle: (n: number) =>
      pick(locale, `Напрямую в узле: ${n}`, `节点内直接：${n}`),
    thOrder: pick(locale, 'Порядок', '顺序'),
    thName: pick(locale, 'Название', '名称'),
    thParent: pick(locale, 'Родитель', '父级'),
    thProductsTotal: pick(locale, 'Товаров (всего)', '商品（合计）'),
    thProductsTotalTitle: pick(
      locale,
      'Включая товары во всех вложенных подкатегориях',
      '含所有子类别中的商品',
    ),
    thSubcats: pick(locale, 'Подкатегорий', '子类别数'),
    thProducts: pick(locale, 'Товаров', '商品'),
    selectAllCats: pick(locale, 'Выбрать все категории', '全选类别'),
  };
}

export function adminCategoryDetailStrings(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Не найдено', '未找到'),
    saveErr: pick(locale, 'Ошибка сохранения', '保存失败'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    notFound: pick(locale, 'Категория не найдена', '未找到类别'),
    backList: pick(locale, 'К списку', '返回列表'),
    coverTitle: pick(locale, 'Обложка категории — выберите изображение', '类别封面 — 请选择图片'),
    backCats: pick(locale, '← Категории', '← 类别'),
    saveBusy: pick(locale, 'Сохранение…', '保存中…'),
    save: pick(locale, 'Сохранить', '保存'),
    saveOkPrefix: pick(locale, 'Сохран', '已保'), // legacy check — prefer equality
    coverMissing: pick(
      locale,
      'Обложка не задана — при необходимости выберите изображение в форме ниже и сохраните.',
      '尚未设置封面 — 可在下方选择图片并保存。',
    ),
    name: pick(locale, 'Название категории', '类别名称'),
    activeAria: pick(locale, 'Активна на витрине', '在前台启用'),
    activeLabel: pick(locale, 'Активна на витрине', '在前台启用'),
    seoTitle: pick(locale, 'SEO title (витрина)', 'SEO 标题（前台）'),
    seoDesc: pick(locale, 'SEO description (витрина)', 'SEO 描述（前台）'),
    cover: pick(locale, 'Обложка', '封面'),
    pickLibrary: pick(locale, 'Выбрать из медиатеки', '从媒体库选择'),
    removeCover: pick(locale, 'Убрать обложку', '移除封面'),
    subcats: pick(locale, 'Подкатегории', '子类别'),
    createSub: pick(locale, 'Создать подкатегорию', '创建子类别'),
    maxDepthTitle: pick(locale, 'Максимум три уровня категорий', '最多三级类别'),
    maxDepth: pick(locale, 'Дочерних уровней больше нет', '已无更深子级'),
    noSubs: pick(locale, 'Подкатегорий пока нет.', '暂无子类别。'),
    products: pick(locale, 'Товары категории', '类别商品'),
    noProducts: pick(locale, 'В этой категории пока нет товаров.', '该类别暂无商品。'),
    thName: pick(locale, 'Название', '名称'),
    thPrice: pick(locale, 'Цена', '价格'),
    thActive: pick(locale, 'Активен', '启用'),
    yes: pick(locale, 'да', '是'),
    no: pick(locale, 'нет', '否'),
  };
}

export function adminCategoryNewStrings(locale: AdminLocale) {
  return {
    errCreate: pick(locale, 'Не удалось создать', '创建失败'),
    coverTitle: pick(locale, 'Обложка категории — выберите изображение', '类别封面 — 请选择图片'),
    back: pick(locale, '← Назад', '← 返回'),
    titleRoot: pick(locale, 'Новая категория', '新建类别'),
    titleSub: pick(locale, 'Новая подкатегория', '新建子类别'),
    name: pick(locale, 'Название', '名称'),
    slugOpt: pick(locale, 'Slug (необязательно)', 'Slug（可选）'),
    slugPh: pick(locale, 'авто из названия', '根据名称自动生成'),
    activeAria: pick(locale, 'Активна на витрине', '在前台启用'),
    activeLabel: pick(locale, 'Активна на витрине', '在前台启用'),
    seoTitle: pick(locale, 'SEO title (витрина)', 'SEO 标题（前台）'),
    seoDesc: pick(locale, 'SEO description (витрина)', 'SEO 描述（前台）'),
    coverOpt: pick(locale, 'Обложка (необязательно)', '封面（可选）'),
    coverLabel: pick(locale, 'Обложка', '封面'),
    coverOptional: pick(locale, '(необязательно)', '（可选）'),
    pickLibrary: pick(locale, 'Выбрать из медиатеки', '从媒体库选择'),
    removeCover: pick(locale, 'Убрать обложку', '移除封面'),
    saveBusy: pick(locale, 'Сохранение…', '保存中…'),
    create: pick(locale, 'Создать', '创建'),
    cancel: pick(locale, 'Отмена', '取消'),
    suspenseLoading: pick(locale, 'Загрузка…', '加载中…'),
  };
}
