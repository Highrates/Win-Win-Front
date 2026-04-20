import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminClientsStrings(locale: AdminLocale) {
  return {
    loginRequired: pick(locale, 'Войдите в админку', '请先登录管理后台'),
    errStatus: (code: number) => pick(locale, `Ошибка ${code}`, `错误 ${code}`),
    errLoadList: pick(locale, 'Не удалось загрузить список', '无法加载列表'),
    searchPlaceholder: pick(locale, 'Поиск по email или телефону', '按邮箱或电话搜索'),
    searchAria: pick(locale, 'Поиск', '搜索'),
    active: pick(locale, 'Активен', '活跃'),
    inactive: pick(locale, 'Неактивен', '未活跃'),
    backAdmin: pick(locale, '← В админку', '← 返回管理后台'),
    pageTitle: pick(locale, 'Пользователи', '用户'),
    pageLead: (total: number) =>
      pick(
        locale,
        `Роль «покупатель» (USER). Всего: ${total}`,
        `购物者角色（USER）。共 ${total} 人`,
      ),
    find: pick(locale, 'Найти', '查找'),
    thPhone: pick(locale, 'Телефон', '电话'),
    thName: pick(locale, 'Имя', '姓名'),
    thRegistered: pick(locale, 'Регистрация', '注册时间'),
    thStatus: pick(locale, 'Статус', '状态'),
    emptyTable: pick(locale, 'Нет записей', '暂无记录'),
    thEmail: 'Email',
  };
}
