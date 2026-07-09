import {
  adminNavLabel,
  type AdminDashboardLinkKey,
  type AdminNavLabelKey,
} from '@win-win/admin-sections';

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

export function getNavLabel(locale: AdminLocale, labelKey: AdminNavLabelKey): string {
  return adminNavLabel(labelKey, locale);
}

export function adminBrandLine(locale: AdminLocale): string {
  return locale === 'zh' ? 'WIN-WIN · 管理面板' : 'WIN-WIN · АДМИН-ПАНЕЛЬ';
}

export function adminNavBadgeTitles(locale: AdminLocale) {
  const pick = (ru: string, zh: string) => (locale === 'zh' ? zh : ru);
  return {
    partnerApps: pick('Необработанные заявки', '待处理申请'),
    ordersPending: pick('Заказы на согласование', '待审批订单'),
    sourcingPending: pick('Новые заявки на подбор', '新采购申请'),
    ordersChatUnread: pick('Непрочитанные сообщения от клиента', '未读客户消息'),
  };
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
  const linkMeta = dashboardLinkMeta(locale);
  if (locale === 'zh') {
    return {
      title: '仪表板',
      lead: '请从左侧菜单进入，或点击下方卡片。数据目前通过 API 填充。',
      accessDenied: '无权访问此分区。',
      linkMeta,
    };
  }
  return {
    title: 'Дашборд',
    lead: 'Выберите раздел в меню слева или перейдите по карточкам ниже. Данные пока наполняются через API.',
    accessDenied: 'Нет доступа к этому разделу.',
    linkMeta,
  };
}

function dashboardLinkMeta(locale: AdminLocale): Record<
  AdminDashboardLinkKey,
  { label: string; note: string }
> {
  if (locale === 'zh') {
    return {
      catalog: { label: adminNavLabel('catalog', 'zh'), note: '商品与类别' },
      brands: { label: adminNavLabel('brands', 'zh'), note: '网站上的品牌' },
      orders: { label: adminNavLabel('orders', 'zh'), note: '状态与单据' },
      clients: { label: adminNavLabel('clients', 'zh'), note: '用户' },
      blog: { label: adminNavLabel('blog', 'zh'), note: '文章' },
      referrals: { label: adminNavLabel('referrals', 'zh'), note: '推荐计划' },
      collections: { label: adminNavLabel('collections', 'zh'), note: '公开精选' },
      productSets: { label: adminNavLabel('productSets', 'zh'), note: '仅商品' },
    };
  }
  return {
    catalog: { label: adminNavLabel('catalog', 'ru'), note: 'Товары и категории' },
    brands: { label: adminNavLabel('brands', 'ru'), note: 'Бренды на сайте' },
    orders: { label: adminNavLabel('orders', 'ru'), note: 'Статусы и документы' },
    clients: { label: adminNavLabel('clients', 'ru'), note: 'Пользователи' },
    blog: { label: adminNavLabel('blog', 'ru'), note: 'Статьи' },
    referrals: { label: adminNavLabel('referrals', 'ru'), note: 'Программа' },
    collections: { label: adminNavLabel('collections', 'ru'), note: 'Публичные подборки' },
    productSets: { label: adminNavLabel('productSets', 'ru'), note: 'Только товары' },
  };
}

export function adminObjectsPageStrings(locale: AdminLocale) {
  if (locale === 'zh') {
    return {
      title: adminNavLabel('objects', 'zh'),
      compressLink: '在此压缩',
    };
  }
  return {
    title: adminNavLabel('objects', 'ru'),
    compressLink: 'Сжимать тут',
  };
}
