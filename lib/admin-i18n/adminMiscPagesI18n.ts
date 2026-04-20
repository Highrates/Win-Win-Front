import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminNavBackToDashboard(locale: AdminLocale) {
  return pick(locale, '← В админку', '← 回管理后台');
}

export function adminModelingPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Моделирование', '建模'),
    lead: pick(locale, 'Раздел админки', '管理后台分区'),
  };
}

export function adminPagesScreen(locale: AdminLocale) {
  return {
    title: pick(locale, 'Информационные страницы / О нас', '信息页 / 关于我们'),
  };
}

export function adminReferralsPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Реферальная программа (админ)', '推荐计划（管理）'),
    lead: pick(locale, 'Настройки: %, фикс, баллы; отчёты', '设置：百分比、固定金额、积分；报表'),
  };
}

export function adminJournalPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Журнал', '日志'),
    lead: pick(
      locale,
      'Кто и что менял в админке, входы и загрузки файлов.',
      '谁在管理后台做了什么、登录与文件上传记录。',
    ),
  };
}

export function adminOrdersPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Заказы', '订单'),
    lead: pick(
      locale,
      'Список заказов и смена статуса (ADMIN / MODERATOR).',
      '订单列表与状态修改（ADMIN / MODERATOR）。',
    ),
  };
}

export function adminBrandsPageTitle(locale: AdminLocale) {
  return pick(locale, 'Бренды', '品牌');
}

export function adminCatalogCategoriesPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Категории', '类别'),
  };
}

export function adminCatalogProductsPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Товары', '商品'),
  };
}

export function adminCollectionNewPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Новая коллекция', '新建集合'),
  };
}

export function adminCollectionEditPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Коллекция', '集合'),
  };
}

export function adminProductSetNewPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Новый набор', '新建套装'),
  };
}

export function adminProductSetEditPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Набор', '套装'),
  };
}

export function adminCategoryNewPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Новая категория', '新建类别'),
  };
}

export function adminCategoryDetailPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Категория', '类别'),
  };
}

export function adminProductNewPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Новый товар', '新建商品'),
  };
}

export function adminProductEditPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Товар', '商品'),
  };
}

export function adminVariantEditPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Вариант', '变体'),
  };
}

export function adminPricingPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Ценообразование', '定价'),
    lead: pick(
      locale,
      'Профили, контейнеры и надбавки. Изменения применяются к новым расчётам.',
      '方案、容器与加价。更改适用于新的计价。',
    ),
  };
}

export function adminSettingsSitePage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Настройки сайта', '网站设置'),
    lead: pick(locale, 'Параметры витрины и интеграций.', '前台与集成参数。'),
    devNote: pick(locale, 'Раздел в разработке.', '该分区开发中。'),
  };
}

export function adminSettingsStaffPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Сотрудники', '员工'),
    lead: pick(locale, 'Учётные записи модераторов и администраторов.', '管理员与版主账号。'),
    devNote: pick(locale, 'Раздел в разработке.', '该分区开发中。'),
  };
}
