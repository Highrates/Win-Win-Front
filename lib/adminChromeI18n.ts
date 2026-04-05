export type AdminLocale = 'ru' | 'zh';

export const ADMIN_LOCALE_STORAGE_KEY = 'winwin-admin-locale';

export const defaultAdminLocale: AdminLocale = 'ru';

const NAV_HREFS = [
  '/admin',
  '/admin/modeling',
  '/admin/clients',
  '/admin/orders',
  '/admin/brands',
  '/admin/objects',
  '/admin/blog',
  '/admin/referrals',
  '/admin/pages',
  '/admin/journal',
] as const;

const navRu: Record<(typeof NAV_HREFS)[number], string> = {
  '/admin': 'Дашборд',
  '/admin/modeling': 'Моделирование',
  '/admin/clients': 'Клиенты',
  '/admin/orders': 'Заказы',
  '/admin/brands': 'Бренды',
  '/admin/objects': 'Объекты',
  '/admin/blog': 'Блог',
  '/admin/referrals': 'Рефералы',
  '/admin/pages': 'Страницы',
  '/admin/journal': 'Журнал',
};

const navZh: Record<(typeof NAV_HREFS)[number], string> = {
  '/admin': '仪表板',
  '/admin/modeling': '建模',
  '/admin/clients': '客户',
  '/admin/orders': '订单',
  '/admin/brands': '品牌',
  '/admin/objects': '对象',
  '/admin/blog': '博客',
  '/admin/referrals': '推荐',
  '/admin/pages': '页面',
  '/admin/journal': '日志',
};

export function catalogGroupLabel(locale: AdminLocale): string {
  return locale === 'zh' ? '目录' : 'Каталог';
}

export function catalogSubLabel(
  locale: AdminLocale,
  key: 'products' | 'categories' | 'collections' | 'productSets'
): string {
  const ru = {
    products: 'Товары',
    categories: 'Категории',
    collections: 'Коллекции',
    productSets: 'Наборы',
  };
  const zh = {
    products: '商品',
    categories: '类别',
    collections: '集合',
    productSets: '套装',
  };
  return locale === 'zh' ? zh[key] : ru[key];
}

export function getNavLabel(locale: AdminLocale, href: string): string {
  const ru = navRu[href as keyof typeof navRu];
  if (ru) return locale === 'zh' ? navZh[href as keyof typeof navZh] : ru;
  return href;
}

export function adminBrandLine(locale: AdminLocale): string {
  return locale === 'zh' ? 'WIN-WIN · 管理面板' : 'WIN-WIN · АДМИН-ПАНЕЛЬ';
}

export function adminChromeStrings(locale: AdminLocale) {
  // Подписи кнопок: на русской раскладке «Русский» и «中文», на китайской — «俄语» и «中文».
  return {
    langHeading: locale === 'zh' ? '语言' : 'Язык',
    langBtnRu: locale === 'zh' ? '俄语' : 'Русский',
    langBtnZh: '中文',
    logout: locale === 'zh' ? '退出' : 'Выйти',
  };
}
