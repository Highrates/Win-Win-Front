import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminClientDetailStrings(locale: AdminLocale) {
  return {
    backList: pick(locale, '← К списку клиентов', '← 返回用户列表'),
    clientTitle: pick(locale, 'Клиент', '客户'),
    /** Подзаголовок: телефон и почта (для h1). */
    titleWithContacts: (phone: string, email: string) =>
      pick(locale, `Клиент: ${phone}, ${email}`, `客户：${phone}，${email}`),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    userNotFound: pick(locale, 'Пользователь не найден', '未找到用户'),
    errStatus: (code: number) => pick(locale, `Ошибка ${code}`, `错误 ${code}`),
    errLoad: pick(locale, 'Не удалось загрузить данные', '无法加载数据'),
    tabOrders: pick(locale, 'Заказы', '订单'),
    tabInfo: pick(locale, 'Инфо', '信息'),
    tabConsents: pick(locale, 'Уведомления', '通知与同意'),
    tabCases: pick(locale, 'Кейсы', '案例'),
    tabsAria: pick(locale, 'Разделы карточки клиента', '客户区段'),
    ordersEmpty: pick(locale, 'Пока нет заказов', '暂无订单'),
    dtEmail: 'Email',
    dtPhone: pick(locale, 'Телефон', '电话'),
    dtName: pick(locale, 'Имя', '姓名'),
    dtCity: pick(locale, 'Город', '城市'),
    dtServices: pick(locale, 'Услуги', '服务'),
    dtAvatar: pick(locale, 'Аватар', '头像'),
    dtCoverUrls: pick(locale, 'Обложка (URL)', '封面（链接）'),
    dtAboutTitle: pick(locale, 'Подробнее о вас', '更多介绍'),
    dtPublication: pick(locale, 'Публикация профиля', '资料发布'),
    linkOpen: pick(locale, 'Открыть', '打开'),
    dtConsentPersonal: pick(locale, 'Согласие на обработку ПДн', '个人数据处理同意'),
    dtConsentSms: pick(locale, 'SMS: сервисные и рекламные (не OTP)', '短信：非验证码营销类'),
    consentYes: pick(locale, 'да', '是'),
    consentNo: pick(locale, 'нет', '否'),
    consentsTabLead: pick(
      locale,
      'Согласия, зафиксированные в учётной записи (дата — время фиксации; «нет» — согласие снято или никогда не давалось).',
      '账户内记录的同意项（“是”为同意时间，“否”为未同意或已撤销）。',
    ),
    tabStructure: pick(locale, 'Структура дизайнера', '设计师网络'),
    dtStatus: pick(locale, 'Статус', '状态'),
    statusPartner: pick(locale, 'Партнёр', '合作方'),
    statusDefault: '—',
    dtReferralCode: pick(locale, 'Реферальный номер', '推荐码'),
    structureEmpty: pick(locale, 'Нет привлечённых', '暂无下线'),
    thLevel: pick(locale, 'Уровень', '层级'),
    thUser: pick(locale, 'Пользователь', '用户'),
    thEmail: 'Email',
    thJoined: pick(locale, 'В структуре', '加入时间'),
    thPartnerCol: pick(locale, 'Партнёр', '合作方'),
    levelL1: 'L1',
    levelL2: 'L2',
    partnerYes: pick(locale, 'Да', '是'),
    partnerNo: pick(locale, 'Нет', '否'),
  };
}
