export type RichBlockLocale = "ru" | "zh";

const pick = <T,>(locale: RichBlockLocale, ru: T, zh: T): T =>
  locale === "zh" ? zh : ru;

export type RichBlockStrings = ReturnType<typeof richBlockStrings>;

/** html[lang] / navigator → ru|zh (для ЛК без AdminLocale). */
export function detectRichBlockLocale(
  fallback: RichBlockLocale = "ru",
): RichBlockLocale {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang?.toLowerCase() ?? "";
    if (lang.startsWith("zh")) return "zh";
    if (lang.startsWith("ru")) return "ru";
  }
  if (typeof navigator !== "undefined") {
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("zh")) return "zh";
  }
  return fallback;
}

export function richBlockStrings(locale: RichBlockLocale = "ru") {
  return {
    editorAria: pick(locale, "Редактор текста", "文本编辑器"),
    editorLoading: pick(locale, "Загрузка редактора…", "编辑器加载中…"),
    formatToolbarAria: pick(locale, "Форматирование", "格式"),
    mediaToolbarAria: pick(
      locale,
      "Параметры выбранного медиа",
      "所选媒体选项",
    ),
    groupHeadings: pick(locale, "Заголовки", "标题"),
    groupMarks: pick(locale, "Начертание", "字体样式"),
    groupLists: pick(locale, "Списки", "列表"),
    groupBlocks: pick(locale, "Блоки", "块"),
    groupHistory: pick(locale, "История", "历史"),
    groupAlign: pick(locale, "Выравнивание текста", "对齐"),
    groupLink: pick(locale, "Ссылка и очистка", "链接与清除"),
    groupMedia: pick(locale, "Медиа", "媒体"),
    groupMediaSize: pick(locale, "Размер медиа", "媒体尺寸"),
    groupMediaPos: pick(locale, "Положение медиа", "媒体位置"),
    h1: pick(locale, "Заголовок 1", "标题 1"),
    h2: pick(locale, "Заголовок 2", "标题 2"),
    h3: pick(locale, "Заголовок 3", "标题 3"),
    bold: pick(locale, "Жирный", "加粗"),
    italic: pick(locale, "Курсив", "斜体"),
    underline: pick(locale, "Подчёркивание", "下划线"),
    bulletList: pick(locale, "Маркированный список", "无序列表"),
    orderedList: pick(locale, "Нумерованный список", "有序列表"),
    undo: pick(locale, "Отменить", "撤销"),
    redo: pick(locale, "Повторить", "重做"),
    blockquote: pick(locale, "Цитата", "引用"),
    horizontalRule: pick(locale, "Горизонтальная линия", "分隔线"),
    miniHistory: pick(locale, "История", "历史"),
    miniBlocks: pick(locale, "Блок", "块"),
    altLabel: pick(locale, "Alt", "Alt"),
    altPlaceholder: pick(
      locale,
      "Описание изображения (SEO / a11y)",
      "图片描述（SEO / 无障碍）",
    ),
    deleteMedia: pick(locale, "Удалить медиа", "删除媒体"),
    deleteMediaConfirm: pick(
      locale,
      "Удалить выбранное изображение или видео?",
      "删除所选图片或视频？",
    ),
    deleteVideoConfirm: pick(
      locale,
      "Удалить выбранное видео?",
      "删除所选视频？",
    ),
    confirmAction: pick(locale, "Подтвердить", "确认"),
    confirmCancel: pick(locale, "Отмена", "取消"),
    moreTools: pick(locale, "Ещё", "更多"),
    moreToolsTitle: pick(
      locale,
      "Дополнительные инструменты",
      "更多工具",
    ),
    videoBadge: pick(locale, "Видео", "视频"),
    videoSelectedHint: pick(
      locale,
      "Для видео доступно удаление (размер и положение — только у фото)",
      "视频仅支持删除（尺寸与位置仅适用于图片）",
    ),
    captionPlaceholder: pick(
      locale,
      "Подпись к изображению…",
      "图片题注…",
    ),
    alignLeft: pick(locale, "По левому краю", "左对齐"),
    alignCenter: pick(locale, "По центру", "居中"),
    alignRight: pick(locale, "По правому краю", "右对齐"),
    link: pick(locale, "Ссылка", "链接"),
    clearFormat: pick(locale, "Сбросить форматирование", "清除格式"),
    clearFormatConfirm: pick(
      locale,
      "Сбросить начертание и структуру блока (заголовки, списки)?",
      "清除字体样式和块结构（标题、列表）？",
    ),
    shortcutsBtn: pick(locale, "Горячие клавиши", "快捷键"),
    shortcutsTitle: pick(locale, "Горячие клавиши", "快捷键"),
    shortcutWithMod: (label: string, mod: string, key: string) =>
      `${label} (${mod}${key})`,
    miniHeadings: pick(locale, "Загол.", "标题"),
    miniMarks: pick(locale, "Стиль", "样式"),
    miniLists: pick(locale, "Список", "列表"),
    miniAlign: pick(locale, "Абзац", "对齐"),
    miniMedia: pick(locale, "Медиа", "媒体"),
    mediaHintDismiss: pick(locale, "Скрыть подсказку", "隐藏提示"),
    photo: pick(locale, "Фото", "图片"),
    video: pick(locale, "Видео", "视频"),
    imageTitle: (src: string) =>
      pick(locale, `Изображение · ${src}`, `图片 · ${src}`),
    videoTitle: (src: string) =>
      pick(locale, `Видео · ${src}`, `视频 · ${src}`),
    mediaSourceLibrary: pick(locale, "Выбор из медиатеки", "从媒体库选择"),
    mediaSourceUpload: pick(locale, "Загрузка на сервер", "上传到服务器"),
    mediaSourceLocal: pick(locale, "Локальный файл", "本地文件"),
    fromLibrary: pick(locale, "Из медиатеки", "媒体库"),
    uploadFile: pick(locale, "Загрузить файл", "上传文件"),
    uploading: pick(locale, "Загрузка…", "上传中…"),
    mediaBadge: pick(locale, "Медиа", "媒体"),
    captionBtn: pick(locale, "Подпись", "题注"),
    captionBtnTitle: pick(
      locale,
      "Добавить или перейти к подписи фото",
      "添加或跳到图片题注",
    ),
    sizeLabel: pick(locale, "Размер", "尺寸"),
    posLabel: pick(locale, "Положение", "位置"),
    altFieldLabel: pick(locale, "Alt-текст", "Alt 文本"),
    sizeSmall: pick(locale, "Маленький", "小"),
    sizeMedium: pick(locale, "Средний", "中"),
    sizeFull: pick(locale, "На всю ширину", "全宽"),
    mediaLeft: pick(locale, "Слева", "左"),
    mediaCenter: pick(locale, "По центру", "居中"),
    mediaRight: pick(locale, "Справа", "右"),
    wrapLeft: pick(
      locale,
      "Обтекание: фото слева, текст справа (пишите текст под фото)",
      "环绕：图左文右（在图片下方输入文字）",
    ),
    wrapRight: pick(
      locale,
      "Обтекание: фото справа, текст слева (пишите текст под фото)",
      "环绕：图右文左（在图片下方输入文字）",
    ),
    wrapLeftShort: pick(locale, "Текст→", "文→"),
    wrapRightShort: pick(locale, "←Текст", "←文"),
    wrapActiveNote: pick(
      locale,
      "Текст после фото встанет сбоку. Два фото рядом: оба «Текст→» и размер S.",
      "图片后的文字会排在侧面。两图并排：都选「文→」且尺寸 S。",
    ),
    mediaHint: pick(
      locale,
      "Фото: клик → подпись, alt, размер; «Текст→» / «←Текст» — обтекание (текст пишите под фото). Два рядом: оба ⇄ и S. Видео → удаление.",
      "图片：点击 → 题注、Alt、尺寸；「文→」/「←文」环绕（文字写在图下）。并排：两个都用环绕+S。视频 → 删除。",
    ),
    linkDialogTitle: pick(locale, "Ссылка", "链接"),
    linkDialogClose: pick(locale, "Закрыть диалог ссылки", "关闭链接对话框"),
    linkUrlLabel: pick(locale, "URL", "URL"),
    linkUrlPh: pick(
      locale,
      "https://example.com или /path",
      "https://example.com 或 /path",
    ),
    linkHint: pick(
      locale,
      "http(s) или относительный путь, начинающийся с /",
      "http(s) 或以 / 开头的相对路径",
    ),
    linkCancel: pick(locale, "Отмена", "取消"),
    linkApply: pick(locale, "Применить", "应用"),
    linkRemove: pick(locale, "Убрать ссылку", "移除链接"),
    noUploadHandler: pick(
      locale,
      "Загрузка медиа недоступна: нет обработчика uploadMedia (data URL запрещены)",
      "无法上传媒体：缺少 uploadMedia（禁止 data URL）",
    ),
    errPickImage: pick(
      locale,
      "Не удалось выбрать изображение",
      "无法选择图片",
    ),
    errPickVideo: pick(locale, "Не удалось выбрать видео", "无法选择视频"),
    errUploadImage: pick(
      locale,
      "Не удалось загрузить изображение",
      "图片上传失败",
    ),
    errUploadVideo: pick(locale, "Не удалось загрузить видео", "视频上传失败"),
    linkErrEmpty: pick(locale, "Введите URL", "请输入 URL"),
    linkErrProtocol: pick(
      locale,
      "Только http(s) или путь /…",
      "仅支持 http(s) 或以 / 开头的路径",
    ),
    linkErrInvalid: pick(locale, "Некорректный URL", "无效的 URL"),
  };
}
