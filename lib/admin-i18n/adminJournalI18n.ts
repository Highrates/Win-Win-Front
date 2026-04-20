import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminJournalStrings(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    purgePasswordPrompt: pick(locale, 'Введите пароль очистки', '请输入清理密码'),
    purgeConfirm: pick(
      locale,
      'Удалить все записи журнала без восстановления? Это не затрагивает заказы и каталог.',
      '永久删除所有日志记录？不会影响订单与目录。',
    ),
    purged: (n: number) => pick(locale, `Удалено записей: ${n}`, `已删除 ${n} 条记录`),
    purgeErr: pick(locale, 'Ошибка очистки', '清理失败'),
    thWhen: pick(locale, 'Когда', '时间'),
    thAction: pick(locale, 'Действие', '操作'),
    thWho: pick(locale, 'Кто', '用户'),
    thPath: pick(locale, 'Путь', '路径'),
    thEntity: pick(locale, 'Сущность', '实体'),
    thDetails: pick(locale, 'Детали', '详情'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Записей пока нет', '暂无记录'),
    back: pick(locale, 'Назад', '上一页'),
    pageOf: (page: number, totalPages: number, total: number) =>
      pick(locale, `Стр. ${page} из ${totalPages} (${total} записей)`, `第 ${page} / ${totalPages} 页（${total} 条）`),
    forward: pick(locale, 'Вперёд', '下一页'),
    purgeTitle: pick(locale, 'Очистка журнала', '清空日志'),
    purgePlaceholder: pick(locale, 'Пароль очистки', '清理密码'),
    purgeBusy: pick(locale, 'Удаление…', '删除中…'),
    purgeBtn: pick(locale, 'Очистить журнал', '清空日志'),
  };
}
