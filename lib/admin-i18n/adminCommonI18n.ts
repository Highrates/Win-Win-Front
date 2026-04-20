import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

/** Общие подписи и ошибки для экранов админки. */
export function adminCommonI18n(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    errDelete: pick(locale, 'Ошибка удаления', '删除失败'),
    errSave: pick(locale, 'Ошибка сохранения', '保存失败'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    save: pick(locale, 'Сохранить', '保存'),
    saving: pick(locale, 'Сохранение…', '保存中…'),
    cancel: pick(locale, 'Отмена', '取消'),
    create: pick(locale, 'Создать', '创建'),
    creating: pick(locale, 'Создание…', '创建中…'),
    deleting: pick(locale, 'Удаление…', '删除中…'),
    delete: pick(locale, 'Удалить', '删除'),
    yes: pick(locale, 'Да', '是'),
    no: pick(locale, 'Нет', '否'),
    backToList: pick(locale, 'К списку', '返回列表'),
    slug: pick(locale, 'Slug', 'Slug'),
    none: pick(locale, '— Нет —', '— 无 —'),
    choose: pick(locale, '— Выберите —', '— 请选择 —'),
    mediaLibrary: pick(locale, 'Медиатека', '媒体库'),
    remove: pick(locale, 'Убрать', '移除'),
    notFound: pick(locale, 'Не найдено', '未找到'),
  };
}
