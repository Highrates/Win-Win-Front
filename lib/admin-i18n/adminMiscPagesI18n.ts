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
    tabLabels: {
      percent: pick(locale, 'Настройка %', '百分比设置'),
      payouts: pick(locale, 'Выплаты', '打款'),
      reports: pick(locale, 'Отчёты', '报表'),
    },
    tabLeads: {
      percent: pick(
        locale,
        'Ставки L1/L2, база начисления, версионирование правил — подключение к `ReferralConfig` и ТЗ.',
        'L1/L2 费率、计提基数、规则版本化 — 对接 ReferralConfig 与需求文档。',
      ),
      payouts: pick(
        locale,
        'Заявки на выплату, статусы, выгрузка для бухгалтерии — общий контур с разделом «Заявки».',
        '提现申请、状态、导出 — 与「申请」板块总流程一致。',
      ),
      reports: pick(
        locale,
        'Сводки по рефералам, оборотам и начислениям — отчёты для операций.',
        '推荐、流水与计提汇总 — 运营报表。',
      ),
    },
  };
}

export function adminApplicationsPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Заявки', '申请'),
    tabLabels: {
      designer: pick(locale, 'Заявки на статус дизайнера', '设计师资格申请'),
      payouts: pick(locale, 'Выплаты', '打款'),
    },
    tabLeads: {
      designer: pick(
        locale,
        'Очередь заявок «Стать партнёром»: CV, образование, реферальный код, модерация.',
        '「成为合作伙伴」申请队列：简历、教育、推荐码与审核。',
      ),
      payouts: pick(
        locale,
        'Выплаты партнёрам по заявкам из ЛК (минимальный порог, статусы) — см. также вкладку «Выплаты» в рефералах.',
        '根据账户内申请的合作伙伴打款（门槛、状态）— 亦见推荐计划中的「打款」。',
      ),
    },
    designer: {
      loading: pick(locale, 'Загрузка…', '加载中…'),
      empty: pick(locale, 'Нет заявок в очереди', '暂无待审申请'),
      thEmail: 'Email',
      thName: pick(locale, 'Имя', '姓名'),
      thSubmitted: pick(locale, 'Подана', '提交于'),
      thRef: pick(locale, 'Реф. в заявке', '申请推荐码'),
      thCv: 'CV',
      rowGoToApplication: pick(locale, 'Открыть карточку заявки', '打开申请详情'),
      thActions: pick(locale, 'Действия', '操作'),
      openCv: pick(locale, 'Открыть', '打开'),
      accept: pick(locale, 'Принять', '通过'),
      reject: pick(locale, 'Отклонить', '拒绝'),
      rejectConfirm: pick(
        locale,
        'Вы уверены, что хотите отклонить заявку?',
        '确定要拒绝该申请吗？',
      ),
      openClient: pick(locale, 'Карточка', '用户'),
      errLoad: pick(locale, 'Не удалось загрузить заявки', '无法加载申请'),
      errAccept: pick(locale, 'Ошибка при принятии заявки', '通过失败'),
      errReject: pick(locale, 'Ошибка при отклонении заявки', '拒绝失败'),
    },
  };
}

export function adminApplicationDetailPage(locale: AdminLocale) {
  return {
    back: pick(locale, '← К списку заявок', '← 返回申请列表'),
    title: pick(locale, 'Заявка партнёра Win-Win', 'Win-Win 合作申请'),
    notFound: pick(locale, 'Пользователь не найден', '未找到用户'),
    errLoad: pick(locale, 'Не удалось загрузить данные', '无法加载数据'),
    aboutTitle: pick(locale, 'Расскажите о себе (сопроводительный текст)', '自我介绍（附信）'),
    refTitle: pick(locale, 'Реферальный номер приглашающего', '邀请人推荐号'),
    refExempt: pick(
      locale,
      'По политике для этого аккаунта номер не требовался (первые партнёры).',
      '此账户依政策可免填推荐号（首批合作方）。',
    ),
    cvTitle: pick(locale, 'Резюме (CV)', '简历（CV）'),
    noCv: pick(locale, 'Файл не прикреплён', '未上传文件'),
    metaTitle: pick(locale, 'Контакты и даты', '联系人与日期'),
    labelEmail: 'Email',
    labelName: pick(locale, 'Имя в профиле', '资料中的姓名'),
    labelSubmitted: pick(locale, 'Заявка подана', '申请提交于'),
    labelRejected: pick(locale, 'Заявка отклонена', '已拒绝于'),
    labelPartner: pick(locale, 'Статус партнёра', '合作方状态'),
    statusApproved: pick(locale, 'Одобрен', '已通过'),
    statusPending: pick(locale, 'Ожидает решения', '待审核'),
    openClient: pick(locale, 'Карточка клиента', '客户档案'),
    openCv: pick(locale, 'Открыть CV', '打开简历'),
    accept: pick(locale, 'Принять', '通过'),
    reject: pick(locale, 'Отклонить', '拒绝'),
    rejectConfirm: pick(
      locale,
      'Вы уверены, что хотите отклонить заявку?',
      '确定要拒绝该申请吗？',
    ),
    errAccept: pick(locale, 'Ошибка при принятии заявки', '通过失败'),
    errReject: pick(locale, 'Ошибка при отклонении заявки', '拒绝失败'),
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
