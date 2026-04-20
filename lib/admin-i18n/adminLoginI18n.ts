import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminLoginStrings(locale: AdminLocale) {
  return {
    title: pick(locale, 'Админ-панель', '管理后台'),
    hint: pick(locale, 'Вход только для ролей ADMIN и MODERATOR', '仅限 ADMIN 与 MODERATOR 登录'),
    email: pick(locale, 'Email', '邮箱'),
    password: pick(locale, 'Пароль', '密码'),
    submitBusy: pick(locale, 'Вход…', '登录中…'),
    submit: pick(locale, 'Войти', '登录'),
    toSite: pick(locale, 'На сайт', '去网站'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    errLogin: pick(locale, 'Ошибка входа', '登录失败'),
    errNetwork: pick(locale, 'Сеть недоступна', '网络不可用'),
  };
}
