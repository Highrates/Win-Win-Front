import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

export type ObjectsLibraryStrings = {
  fileGeneric: string;
  folderRoot: string;
  folderExpandNested: string;
  folderCollapseNested: string;
  folderSettingsTitle: string;
  folderSettingsAria: string;
  errLoadFolders: string;
  errLoadObjects: string;
  errCreateFolder: string;
  errDeleteFolder: string;
  errOpenObject: string;
  errDeleteObject: string;
  errNameRequired: string;
  errSave: string;
  errUploadFile: string;
  deleteFolderConfirm: (name: string) => string;
  deleteObjectConfirm: string;
  thumbPdfDoc: string;
  thumbModel3d: string;
  thumbVideo: string;
  tabAll: string;
  tabImages: string;
  tabDocuments: string;
  tabModels: string;
  tabVideos: string;
  foldersAsideLabel: string;
  foldersTitle: string;
  allLocations: string;
  newFolderButton: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  uploadLabel: string;
  uploadLabelBusy: string;
  uploadAria: string;
  uploadTitle: string;
  tablistAria: string;
  loading: string;
  emptyList: string;
  propertiesTitle: string;
  propertiesAria: string;
  newFolderDialogTitle: string;
  labelName: string;
  labelParentFolder: string;
  rootOption: string;
  cancel: string;
  create: string;
  creating: string;
  folderDialogTitle: string;
  pathStats: (path: string, objects: number, children: number) => string;
  systemFolderNoDelete: string;
  delete: string;
  deleting: string;
  detailPropertiesTitle: string;
  fileNameLabel: string;
  folderLabel: string;
  rootOptionDetail: string;
  altDescriptionPlaceholder: string;
  close: string;
  save: string;
  saving: string;
  uploadPartialFail: (errCount: number, total: number, lines: string) => string;
  uploadAllOk: (n: number) => string;
  uploadPartialOk: (ok: number, total: number) => string;
};

const ru: ObjectsLibraryStrings = {
  fileGeneric: 'Файл',
  folderRoot: 'Корень',
  folderExpandNested: 'Развернуть вложенные папки',
  folderCollapseNested: 'Свернуть вложенные папки',
  folderSettingsTitle: 'Настройки папки',
  folderSettingsAria: 'Настройки папки',
  errLoadFolders: 'Не удалось загрузить папки',
  errLoadObjects: 'Ошибка загрузки',
  errCreateFolder: 'Не удалось создать папку',
  errDeleteFolder: 'Не удалось удалить папку',
  errOpenObject: 'Не удалось открыть объект',
  errDeleteObject: 'Не удалось удалить',
  errNameRequired: 'Укажите имя файла',
  errSave: 'Не удалось сохранить',
  errUploadFile: 'Ошибка загрузки',
  deleteFolderConfirm: (name: string) =>
    `Удалить папку «${name}»? Должна быть пустой (без вложенных папок и файлов).`,
  deleteObjectConfirm:
    'Удалить объект из хранилища? Ссылка перестанет работать. Действие необратимо.',
  thumbPdfDoc: 'PDF / документ',
  thumbModel3d: '3D модель',
  thumbVideo: 'Видео',
  tabAll: 'Все объекты',
  tabImages: 'Изображения',
  tabDocuments: 'Документы',
  tabModels: '3D модели',
  tabVideos: 'Видео',
  foldersAsideLabel: 'Папки',
  foldersTitle: 'Папки',
  allLocations: 'Все расположения',
  newFolderButton: 'Новая папка',
  searchPlaceholder: 'Поиск по имени или alt…',
  searchAriaLabel: 'Поиск объектов',
  uploadLabel: 'Загрузить файлы',
  uploadLabelBusy: 'Загрузка…',
  uploadAria: 'Загрузить файлы',
  uploadTitle: 'Загрузить файлы',
  tablistAria: 'Тип объекта',
  loading: 'Загрузка…',
  emptyList: 'Нет объектов по текущим фильтрам.',
  propertiesTitle: 'Свойства',
  propertiesAria: 'Свойства объекта',
  newFolderDialogTitle: 'Новая папка',
  labelName: 'Название',
  labelParentFolder: 'Родительская папка',
  rootOption: 'Корень',
  cancel: 'Отмена',
  create: 'Создать',
  creating: 'Создание…',
  folderDialogTitle: 'Папка',
  pathStats: (path, objects, children) =>
    `Путь: ${path} · объектов: ${objects}, вложенных папок: ${children}`,
  systemFolderNoDelete: 'Системная папка — удаление недоступно',
  delete: 'Удалить',
  deleting: 'Удаление…',
  detailPropertiesTitle: 'Свойства',
  fileNameLabel: 'Имя файла',
  folderLabel: 'Папка',
  rootOptionDetail: 'Корень (без папки)',
  altDescriptionPlaceholder: 'Описание для доступности',
  close: 'Закрыть',
  save: 'Сохранить',
  saving: 'Сохранение…',
  uploadPartialFail: (errCount, total, lines) =>
    `Не удалось загрузить ${errCount} из ${total}:\n${lines}`,
  uploadAllOk: (n) => `Загружено файлов: ${n}`,
  uploadPartialOk: (ok, total) => `Загружено: ${ok} из ${total}`,
};

const zh: ObjectsLibraryStrings = {
  fileGeneric: '文件',
  folderRoot: '根目录',
  folderExpandNested: '展开子文件夹',
  folderCollapseNested: '折叠子文件夹',
  folderSettingsTitle: '文件夹设置',
  folderSettingsAria: '文件夹设置',
  errLoadFolders: '无法加载文件夹',
  errLoadObjects: '加载失败',
  errCreateFolder: '无法创建文件夹',
  errDeleteFolder: '无法删除文件夹',
  errOpenObject: '无法打开对象',
  errDeleteObject: '无法删除',
  errNameRequired: '请填写文件名',
  errSave: '无法保存',
  errUploadFile: '上传失败',
  deleteFolderConfirm: (name: string) =>
    `删除文件夹「${name}」？须为空（无子文件夹与文件）。`,
  deleteObjectConfirm: '从存储中删除该对象？链接将失效。此操作不可撤销。',
  thumbPdfDoc: 'PDF / 文档',
  thumbModel3d: '3D 模型',
  thumbVideo: '视频',
  tabAll: '全部对象',
  tabImages: '图片',
  tabDocuments: '文档',
  tabModels: '3D 模型',
  tabVideos: '视频',
  foldersAsideLabel: '文件夹',
  foldersTitle: '文件夹',
  allLocations: '全部位置',
  newFolderButton: '新建文件夹',
  searchPlaceholder: '按名称或 alt 搜索…',
  searchAriaLabel: '搜索对象',
  uploadLabel: '上传文件',
  uploadLabelBusy: '上传中…',
  uploadAria: '上传文件',
  uploadTitle: '上传文件',
  tablistAria: '对象类型',
  loading: '加载中…',
  emptyList: '当前筛选下没有对象。',
  propertiesTitle: '属性',
  propertiesAria: '对象属性',
  newFolderDialogTitle: '新建文件夹',
  labelName: '名称',
  labelParentFolder: '父文件夹',
  rootOption: '根目录',
  cancel: '取消',
  create: '创建',
  creating: '创建中…',
  folderDialogTitle: '文件夹',
  pathStats: (path, objects, children) =>
    `路径：${path} · 对象：${objects}，子文件夹：${children}`,
  systemFolderNoDelete: '系统文件夹 — 不可删除',
  delete: '删除',
  deleting: '删除中…',
  detailPropertiesTitle: '属性',
  fileNameLabel: '文件名',
  folderLabel: '文件夹',
  rootOptionDetail: '根目录（无文件夹）',
  altDescriptionPlaceholder: '无障碍描述',
  close: '关闭',
  save: '保存',
  saving: '保存中…',
  uploadPartialFail: (errCount, total, lines) =>
    `有 ${errCount} / ${total} 个文件上传失败：\n${lines}`,
  uploadAllOk: (n) => `已上传 ${n} 个文件`,
  uploadPartialOk: (ok, total) => `已上传 ${ok} / ${total} 个文件`,
};

export function objectsLibraryStrings(locale: AdminLocale): ObjectsLibraryStrings {
  return locale === 'zh' ? zh : ru;
}
