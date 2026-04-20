export type AdminLocale = 'ru' | 'zh';

export const ADMIN_LOCALE_STORAGE_KEY = 'winwin-admin-locale';

/** Cookie для SSR: та же локаль, что и в сайдбаре, доступна в `getAdminLocale()` на сервере. */
export const ADMIN_LOCALE_COOKIE_NAME = 'winwin-admin-locale';

export const defaultAdminLocale: AdminLocale = 'ru';

/** Строка для `document.cookie` (Path=/admin). */
export function adminLocaleCookieString(locale: AdminLocale): string {
  const maxAge = 60 * 60 * 24 * 365;
  return `${ADMIN_LOCALE_COOKIE_NAME}=${locale}; Path=/admin; Max-Age=${maxAge}; SameSite=Lax`;
}

const NAV_HREFS = [
  '/admin',
  '/admin/modeling',
  '/admin/clients',
  '/admin/orders',
  '/admin/brands',
  '/admin/objects',
  '/admin/blog',
  '/admin/pages',
  '/admin/journal',
] as const;

const navRu: Record<(typeof NAV_HREFS)[number], string> = {
  '/admin': 'Дашборд',
  '/admin/modeling': 'Моделирование',
  '/admin/clients': 'Пользователи',
  '/admin/orders': 'Заказы',
  '/admin/brands': 'Бренды',
  '/admin/objects': 'Объекты',
  '/admin/blog': 'Блог',
  '/admin/pages': 'Страницы',
  '/admin/journal': 'Журнал',
};

const navZh: Record<(typeof NAV_HREFS)[number], string> = {
  '/admin': '仪表板',
  '/admin/modeling': '建模',
  '/admin/clients': '用户',
  '/admin/orders': '订单',
  '/admin/brands': '品牌',
  '/admin/objects': '对象',
  '/admin/blog': '博客',
  '/admin/pages': '页面',
  '/admin/journal': '日志',
};

export function catalogGroupLabel(locale: AdminLocale): string {
  return locale === 'zh' ? '目录' : 'Каталог';
}

export function settingsGroupLabel(locale: AdminLocale): string {
  return locale === 'zh' ? '设置' : 'Настройки';
}

export function settingsSubLabel(
  locale: AdminLocale,
  key: 'pricing' | 'staff' | 'referrals' | 'site',
): string {
  const ru = {
    pricing: 'Ценообразование',
    staff: 'Сотрудники',
    referrals: 'Реферальная программа',
    site: 'Настройки сайта',
  };
  const zh = {
    pricing: '定价',
    staff: '员工',
    referrals: '推荐计划',
    site: '网站设置',
  };
  return locale === 'zh' ? zh[key] : ru[key];
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
    /** aria-label для основного списка разделов в сайдбаре */
    navAria: locale === 'zh' ? '管理区' : 'Разделы админки',
    expandCollapseChevron: locale === 'zh' ? '展开或折叠' : 'Развернуть или свернуть',
  };
}

export function adminDashboardStrings(locale: AdminLocale) {
  if (locale === 'zh') {
    return {
      title: '仪表板',
      lead: '请从左侧菜单进入，或点击下方卡片。数据目前通过 API 填充。',
      links: [
        { href: '/admin/catalog', label: '目录', note: '商品与类别' },
        { href: '/admin/brands', label: '品牌', note: '网站上的品牌' },
        { href: '/admin/orders', label: '订单', note: '状态与单据' },
        { href: '/admin/clients', label: '客户', note: '用户' },
        { href: '/admin/blog', label: '博客', note: '文章' },
        { href: '/admin/referrals', label: '推荐', note: '推荐计划' },
        { href: '/admin/collections', label: '集合', note: '公开精选' },
        { href: '/admin/product-sets', label: '套装', note: '仅商品' },
        { href: '/admin/pages', label: '页面', note: '信息页' },
        { href: '/admin/modeling', label: '建模', note: '建模服务' },
      ] as const,
    };
  }
  return {
    title: 'Дашборд',
    lead: 'Выберите раздел в меню слева или перейдите по карточкам ниже. Данные пока наполняются через API.',
    links: [
      { href: '/admin/catalog', label: 'Каталог', note: 'Товары и категории' },
      { href: '/admin/brands', label: 'Бренды', note: 'Бренды на сайте' },
      { href: '/admin/orders', label: 'Заказы', note: 'Статусы и документы' },
      { href: '/admin/clients', label: 'Клиенты', note: 'Пользователи' },
      { href: '/admin/blog', label: 'Блог', note: 'Статьи' },
      { href: '/admin/referrals', label: 'Рефералы', note: 'Программа' },
      { href: '/admin/collections', label: 'Коллекции', note: 'Публичные подборки' },
      { href: '/admin/product-sets', label: 'Наборы', note: 'Только товары' },
      { href: '/admin/pages', label: 'Страницы', note: 'Инфостраницы' },
      { href: '/admin/modeling', label: 'Моделирование', note: 'Сервис моделирования' },
    ] as const,
  };
}

export function adminObjectsPageStrings(locale: AdminLocale) {
  if (locale === 'zh') {
    return {
      title: '对象',
      compressLink: '在此压缩',
    };
  }
  return {
    title: 'Объекты',
    compressLink: 'Сжимать тут',
  };
}
