import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminBlogPageTitle(locale: AdminLocale) {
  return pick(locale, 'Блог', '博客');
}

export function adminBlogNewPageStrings(locale: AdminLocale) {
  return {
    title: pick(locale, 'Новая статья', '新文章'),
    lead: pick(
      locale,
      'Заголовок, рубрика, дата, краткое описание и основной текст.',
      '标题、栏目、日期、摘要与正文。',
    ),
  };
}

export function adminBlogEditPageStrings(locale: AdminLocale) {
  return {
    title: pick(locale, 'Редактирование статьи', '编辑文章'),
    lead: pick(locale, 'Изменения сохраняются по кнопке «Сохранить».', '点击「保存」提交更改。'),
  };
}

export function adminBlogListStrings(locale: AdminLocale) {
  return {
    dragTitle: pick(locale, 'Перетащить', '拖动'),
    selectRow: (title: string) => pick(locale, `Выбрать ${title}`, `选择 ${title}`),
    published: pick(locale, 'Опубликована', '已发布'),
    draft: pick(locale, 'Черновик', '草稿'),
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    errReorder: pick(locale, 'Не удалось сохранить порядок', '无法保存排序'),
    confirmDelete: (n: number) =>
      pick(locale, `Удалить выбранные статьи (${n})?`, `删除所选 ${n} 篇文章？`),
    errDelete: pick(locale, 'Ошибка удаления', '删除失败'),
    thOrder: pick(locale, 'Порядок', '顺序'),
    selectAllPage: pick(locale, 'Выбрать все на странице', '全选本页'),
    thTitle: pick(locale, 'Название', '标题'),
    thCategory: pick(locale, 'Категория', '分类'),
    thVisibility: pick(locale, 'Доступность', '可见性'),
    thDate: pick(locale, 'Дата', '日期'),
    searchPh: pick(locale, 'Поиск по заголовку, slug…', '按标题、slug 搜索…'),
    searchAria: pick(locale, 'Поиск статей', '搜索文章'),
    filterCatAria: pick(locale, 'Фильтр по категории', '按分类筛选'),
    allCategories: pick(locale, 'Все категории', '全部分类'),
    newPost: pick(locale, 'Новая статья', '新文章'),
    bulkAria: pick(locale, 'Массовые операции', '批量操作'),
    selectAllOnPage: pick(locale, 'Выбрать все на странице', '全选本页'),
    clearSelection: pick(locale, 'Снять выбор', '取消选择'),
    deleteBulk: (n: number) => pick(locale, `Удалить (${n})`, `删除 (${n})`),
    bulkBusy: pick(locale, '…', '…'),
    reorderLimit: (limit: number) =>
      pick(
        locale,
        `Статей больше ${limit} — порядок перетаскиванием недоступен. Используйте поиск или фильтр по категории.`,
        `文章超过 ${limit} 篇时无法拖拽排序。请使用搜索或分类筛选。`,
      ),
    reorderHint: pick(
      locale,
      'Порядок строк сохраняется для списка на сайте. Тяните за ⋮⋮.',
      '行顺序会保存到网站列表。拖动 ⋮⋮ 调整。',
    ),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Статей не найдено.', '未找到文章。'),
    back: pick(locale, 'Назад', '上一页'),
    pageOf: (page: number, totalPages: number, total: number) =>
      pick(locale, `Страница ${page} из ${totalPages} (${total} всего)`, `第 ${page} / ${totalPages} 页（共 ${total} 篇）`),
    forward: pick(locale, 'Вперёд', '下一页'),
  };
}

export function adminBlogCategoriesStrings(locale: AdminLocale) {
  return {
    errCreate: pick(locale, 'Не удалось создать', '创建失败'),
    confirmDelete: (name: string) => pick(locale, `Удалить категорию «${name}»?`, `删除分类「${name}」？`),
    errDelete: pick(locale, 'Не удалось удалить', '删除失败'),
    panelTitle: pick(locale, 'Категории материалов', '文章分类'),
    emptyHint: pick(locale, 'Категорий пока нет — добавьте первую ниже.', '暂无分类 — 请在下方添加。'),
    slugArticles: (slug: string, count: number) =>
      pick(locale, `slug: ${slug} · статей: ${count}`, `slug：${slug} · 文章：${count}`),
    deleteBlockedTitle: pick(locale, 'Сначала перенесите или удалите статьи', '请先移动或删除文章'),
    delete: pick(locale, 'Удалить', '删除'),
    namePh: pick(locale, 'Название', '名称'),
    nameAria: pick(locale, 'Название новой категории', '新分类名称'),
    addBusy: pick(locale, 'Сохранение…', '保存中…'),
    add: pick(locale, 'Добавить категорию', '添加分类'),
  };
}

export function adminBlogPostEditorStrings(locale: AdminLocale) {
  return {
    notFound: pick(locale, 'Не найдено', '未找到'),
    pickerVideo: pick(locale, 'Видео для статьи', '文章视频'),
    pickerImage: pick(locale, 'Изображение для статьи', '文章图片'),
    titleRequired: pick(locale, 'Укажите заголовок', '请填写标题'),
    saved: pick(locale, 'Сохранено', '已保存'),
    saveErr: pick(locale, 'Ошибка сохранения', '保存失败'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    toList: pick(locale, 'К списку', '返回列表'),
    backList: pick(locale, '← К списку статей', '← 返回文章列表'),
    titleLabel: pick(locale, 'Заголовок', '标题'),
    category: pick(locale, 'Категория', '分类'),
    noCategory: pick(locale, 'Без категории', '无分类'),
    dateLabel: pick(locale, 'Дата статьи', '发布日期'),
    excerpt: pick(locale, 'Короткое описание', '摘要'),
    cover: pick(locale, 'Обложка', '封面'),
    coverPicker: pick(locale, 'Обложка статьи', '文章封面'),
    coverChange: pick(locale, 'Изменить из медиатеки', '从媒体库更换'),
    coverPick: pick(locale, 'Из медиатеки', '从媒体库'),
    removeCover: pick(locale, 'Убрать обложку', '移除封面'),
    slugOptional: pick(locale, 'Slug (необязательно)', 'Slug（可选）'),
    slugPh: pick(locale, 'Авто из заголовка, если пусто', '留空则根据标题自动生成'),
    publishedAria: pick(locale, 'Опубликована на сайте', '在网站发布'),
    publishedLabel: pick(locale, 'Опубликована на сайте', '在网站发布'),
    body: pick(locale, 'Текст статьи', '正文'),
    saveBusy: pick(locale, 'Сохранение…', '保存中…'),
    save: pick(locale, 'Сохранить', '保存'),
  };
}
