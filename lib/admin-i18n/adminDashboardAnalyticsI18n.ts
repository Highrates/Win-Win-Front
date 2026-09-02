import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminDashboardAnalyticsStrings(locale: AdminLocale) {
  return {
    loading: pick(locale, 'Загрузка метрик…', '加载指标…'),
    loadError: pick(locale, 'Не удалось загрузить метрики', '无法加载指标'),
    retry: pick(locale, 'Повторить', '重试'),

    chipToday: pick(locale, 'Сегодня', '今天'),
    chipMonth: pick(locale, 'Этот месяц', '本月'),
    chipPeriod: pick(locale, 'Период', '时间段'),
    periodFrom: pick(locale, 'С', '从'),
    periodTo: pick(locale, 'По', '到'),
    periodApply: pick(locale, 'Применить', '应用'),

    assistantTitle: pick(locale, 'Ассистент', '助手'),
    assistantThinking: pick(locale, 'Считаю подсказки…', '正在生成提示…'),
    assistantEmpty: pick(locale, 'Пока нет подсказок за выбранный период.', '该时段暂无提示。'),
    assistantAsk: pick(locale, 'Спросить ассистента', '询问助手'),
    assistantExpand: pick(locale, 'Развернуть ассистента', '展开助手'),
    assistantCollapse: pick(locale, 'Свернуть ассистента', '收起助手'),

    ordersTitle: pick(locale, '📦 Заказы', '📦 订单'),
    ordersNew: pick(locale, 'Новые', '新订单'),
    ordersActive: pick(locale, 'В работе', '进行中'),

    sourcingTitle: pick(locale, '🔍 Подбор', '🔍 采购申请'),
    sourcingPending: pick(locale, 'Новые', '新申请'),
    sourcingInProgress: pick(locale, 'В работе', '进行中'),

    qaTitle: pick(locale, '💬 Q&A', '💬 问答'),
    qaUnread: pick(locale, 'Непрочитанные', '未读'),

    chatTitle: pick(locale, '✉️ Чат заказов', '✉️ 订单聊天'),
    chatUnread: pick(locale, 'Всего', '合计'),
    chatNew: pick(locale, 'Новые', '新订单'),
    chatActive: pick(locale, 'В работе', '进行中'),

    partnersTitle: pick(locale, '🤝 Партнёры', '🤝 合作伙伴'),
    partnersNew: pick(locale, 'Новые', '新申请'),

    usersTitle: pick(locale, '👤 Новые пользователи', '👤 新用户'),
    usersNew: pick(locale, 'Новые', '新用户'),

    catalogTitle: pick(locale, '🗂 Каталог', '🗂 目录'),
    catalogNoMods: pick(locale, 'Без модификаций', '无修改项'),
    catalogNoModsHint: pick(
      locale,
      'Нет ни одной модификации (размер/конфигурация). Простой товар тоже должен иметь ≥1 модификацию.',
      '没有任何修改项（尺寸/配置）。简单商品也应至少有 1 个修改项。',
    ),
    catalogNoVariants: pick(locale, 'Без вариантов', '无变体'),
    catalogNoVariantsHint: pick(
      locale,
      'Простой товар: модификации есть, SKU/вариантов нет, элементов нет. Составные — в «Составной недозаполнен».',
      '简单商品：已有修改项，无 SKU/变体，无部件。组合商品见「组合未填完」。',
    ),
    catalogActiveEmpty: pick(locale, 'Активен, но пустой', '已上架但未填'),
    catalogActiveEmptyHint: pick(
      locale,
      'Товар «в каталоге», при этом нет модификаций или нет вариантов — витрина с дырой (сводка по статусу).',
      '商品已上架，但没有修改项或没有变体 — 前台有洞（按上架状态汇总）。',
    ),
    catalogElementEmptyPool: pick(locale, 'Элемент без пула', '部件无材质池'),
    catalogElementEmptyPoolHint: pick(
      locale,
      'Есть элемент (сиденье, корпус…), но пул материал-цветов пуст — не из чего собрать вариант.',
      '已有部件（座面、柜体…），但材质色池为空 — 无法组成变体。',
    ),
    catalogCompositeIncomplete: pick(locale, 'Составной недозаполнен', '组合未填完'),
    catalogCompositeIncompleteHint: pick(
      locale,
      'У товара есть элементы и заполненные пулы, но вариантов всё ещё нет.',
      '商品有部件且材质池已填，但仍没有变体。',
    ),

    scopePeriod: pick(locale, 'За период', '按时间段'),
    scopeSnapshot: pick(locale, 'Сейчас', '当前'),

    periodCancel: pick(locale, 'Отмена', '取消'),
    dismissAria: pick(locale, 'Закрыть', '关闭'),
    noSections: pick(locale, 'Нет доступных разделов.', '暂无可用分区。'),
  };
}
