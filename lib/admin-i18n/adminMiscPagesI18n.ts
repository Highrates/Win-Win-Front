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
    title: pick(locale, 'Реферальная программа', '推荐计划'),
    lead: pick(locale, 'Настройки: %, фикс, баллы; отчёты', '设置：百分比、固定金额、积分；报表'),
    tabLabels: {
      percent: pick(locale, 'Настройка %', '百分比设置'),
      payouts: pick(locale, 'Выплаты', '打款'),
      reports: pick(locale, 'Отчёты', '报表'),
    },
    tabLeads: {
      percent: pick(locale, '', ''),
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
  };
}

export function adminDesignerProjectsPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Проекты комплектации (ЛК)', '账户选配项目'),
    lead: pick(
      locale,
      'Операционная видимость: владелец, строки и суммы по актуальным ценам каталога.',
      '运营视图：所有者、行项与按目录现价估算的金额。',
    ),
    searchPlaceholder: pick(locale, 'Поиск: название, адрес, email пользователя…', '搜索：名称、地址、用户邮箱…'),
    thProject: pick(locale, 'Проект', '项目'),
    thUser: pick(locale, 'Пользователь', '用户'),
    thLines: pick(locale, 'Строк', '行'),
    thRooms: pick(locale, 'Комнат', '房间'),
    thTotal: pick(locale, 'Сумма', '金额'),
    thUpdated: pick(locale, 'Обновлён', '更新'),
    empty: pick(locale, 'Ничего не найдено', '无结果'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    prev: pick(locale, 'Назад', '上一页'),
    next: pick(locale, 'Вперёд', '下一页'),
    pageOf: (page: number, pages: number) =>
      pick(locale, `Стр. ${page} из ${pages}`, `第 ${page} / ${pages} 页`),
    detailBack: pick(locale, '← К списку проектов', '← 返回项目列表'),
    detailUser: pick(locale, 'Пользователь', '用户'),
    detailAddress: pick(locale, 'Адрес', '地址'),
    detailUpdated: pick(locale, 'Обновлён', '更新'),
    detailTotal: pick(locale, 'Итого (оценка)', '合计（估算）'),
    linesTitle: pick(locale, 'Строки спецификации', '规格行'),
    lineProduct: pick(locale, 'Товар', '商品'),
    lineCategory: pick(locale, 'Категория', '类别'),
    lineQty: pick(locale, 'Кол-во', '数量'),
    lineUnit: pick(locale, 'Ед.', '单位'),
    lineVariant: pick(locale, 'Вариант SKU', 'SKU'),
    lineTotal: pick(locale, 'Сумма строки', '行金额'),
    errLoad: pick(locale, 'Не удалось загрузить', '加载失败'),
  };
}

export function adminUserGroupsPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Группы пользователей', '用户组'),
    lead: pick(
      locale,
      'Общие условия для участников: реферальная программа, бонус дизайнера. Без группы — основные профили.',
      '成员共用条件：推荐计划、设计师奖金。未分组用户使用主要配置。',
    ),
    groupsHeading: pick(locale, 'Группы', '分组'),
    paramsHeading: pick(locale, 'Параметры', '参数'),
    membersHeading: (count: number) => pick(locale, `Участники (${count})`, `成员（${count}）`),
    addGroup: pick(locale, 'Добавить', '添加'),
    addMember: pick(locale, 'Добавить', '添加'),
    removeMember: pick(locale, 'Убрать', '移除'),
    save: pick(locale, 'Сохранить', '保存'),
    saving: pick(locale, 'Сохранение…', '保存中…'),
    delete: pick(locale, 'Удалить', '删除'),
    selectOrCreate: pick(locale, 'Выберите группу слева или создайте новую.', '请选择左侧分组或新建。'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    errLoad: pick(locale, 'Не удалось загрузить группы', '无法加载用户组'),
    errCreateProfiles: pick(
      locale,
      'Сначала создайте профили рефералов и бонусов дизайнера.',
      '请先创建推荐与设计师奖金配置。',
    ),
    errPickProfiles: pick(locale, 'Выберите профили рефералов и бонуса.', '请选择推荐与奖金配置。'),
    errMemberId: pick(locale, 'Укажите ID пользователя.', '请填写用户 ID。'),
    errCreate: pick(locale, 'Не удалось создать группу', '无法创建分组'),
    errSave: pick(locale, 'Не удалось сохранить', '保存失败'),
    errDelete: pick(locale, 'Не удалось удалить', '删除失败'),
    errAddMember: pick(locale, 'Не удалось добавить участника', '无法添加成员'),
    errRemoveMember: pick(locale, 'Не удалось удалить участника', '无法移除成员'),
    confirmDelete: (name: string) => pick(locale, `Удалить группу «${name}»?`, `删除分组「${name}」？`),
    deleteBlocked: pick(locale, 'Сначала удалите участников', '请先移除所有成员'),
    membersCount: (n: number) => pick(locale, `${n} уч.`, `${n} 人`),
    fieldName: pick(locale, 'Название (админка)', '名称（后台）'),
    fieldLabel: pick(locale, 'Лейбл (бейдж в ЛК)', '标签（账户徽章）'),
    fieldReferralProfile: pick(locale, 'Профиль реферальной программы', '推荐计划配置'),
    fieldBonusProfile: pick(locale, 'Профиль бонуса дизайнера', '设计师奖金配置'),
    fieldPricingProfile: pick(locale, 'Профиль ценообразования', '定价配置'),
    pricingProfileNone: pick(locale, 'Не задан (стандартные цены)', '未设置（标准价格）'),
    pricingProfileHint: pick(
      locale,
      'На витрине подключится в фазе 3; сейчас сохраняется в группе.',
      '将在第 3 阶段用于前台；当前仅保存在分组中。',
    ),
    pickMembers: pick(locale, 'Выбрать участников', '选择成员'),
    memberPickerTitle: pick(locale, 'Выбор участников', '选择成员'),
    memberPickerClose: pick(locale, 'Закрыть', '关闭'),
    memberPickerCancel: pick(locale, 'Отмена', '取消'),
    memberPickerSave: (n: number) =>
      pick(locale, n > 0 ? `Добавить (${n})` : 'Добавить', n > 0 ? `添加（${n}）` : '添加'),
    memberPickerSelected: (n: number) => pick(locale, `Выбрано: ${n}`, `已选：${n}`),
    memberPickerSelectRow: pick(locale, 'выбрать', '选择'),
    memberPickerHint: pick(
      locale,
      'Отметьте клиентов в списке и нажмите «Добавить».',
      '在列表中勾选客户后点击「添加」。',
    ),
    memberPickerEmptyList: pick(locale, 'Список пуст. Уточните поиск.', '列表为空，请调整搜索。'),
    memberSearchPlaceholder: pick(
      locale,
      'Email, телефон или имя…',
      '邮箱、电话或姓名…',
    ),
    memberSearchAria: pick(locale, 'Поиск клиента для добавления в группу', '搜索要加入的客户'),
    memberSearchEmpty: pick(locale, 'Никого не найдено.', '未找到用户。'),
    memberAlreadyInGroup: pick(locale, 'Уже в группе', '已在组内'),
    emptyMembers: pick(locale, 'Пока нет участников.', '暂无成员。'),
    colMemberName: pick(locale, 'Имя', '姓名'),
    colMemberEmail: pick(locale, 'Email', '邮箱'),
    removeMemberAria: pick(locale, 'Удалить из группы', '从组中移除'),
  };
}
