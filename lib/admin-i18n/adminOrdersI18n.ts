import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';
import { ORDER_STATUS_DRAFT, ORDER_STATUS_FLOW, orderStatusLabel } from '@/lib/orders/orderStatus';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminOrderStatusLabels(locale: AdminLocale): Record<string, string> {
  const loc = locale === 'zh' ? 'zh' : 'ru';
  const out: Record<string, string> = {
    [ORDER_STATUS_DRAFT]: orderStatusLabel(ORDER_STATUS_DRAFT, loc),
  };
  for (const code of ORDER_STATUS_FLOW) {
    out[code] = orderStatusLabel(code, loc);
  }
  return out;
}

export function adminOrdersStrings(locale: AdminLocale) {
  return {
    errLoad: pick(locale, 'Ошибка загрузки', '加载失败'),
    errSaveStatus: pick(locale, 'Не удалось сохранить статус', '无法保存状态'),
    searchPh: pick(locale, 'ID заказа, email или телефон', '订单 ID、邮箱或电话'),
    find: pick(locale, 'Найти', '查找'),
    thDate: pick(locale, 'Дата', '日期'),
    thOrder: pick(locale, 'Заказ', '订单'),
    thClient: pick(locale, 'Клиент', '客户'),
    thSum: pick(locale, 'Сумма', '金额'),
    thStatus: pick(locale, 'Статус', '状态'),
    thChat: pick(locale, 'Сообщения', '消息'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Нет заказов', '暂无订单'),
    itemsCount: (n: number) => pick(locale, `${n} поз.`, `${n} 项`),
    save: pick(locale, 'Сохранить', '保存'),
    saving: pick(locale, '…', '…'),
    back: pick(locale, 'Назад', '上一页'),
    pageOf: (page: number, totalPages: number, total: number) =>
      pick(locale, `Стр. ${page} из ${totalPages} (${total})`, `第 ${page} / ${totalPages} 页（${total}）`),
    forward: pick(locale, 'Вперёд', '下一页'),
    tabsAria: pick(locale, 'Разделы списка заказов', '订单列表分区'),
    tabNew: pick(locale, 'Новые заказы', '新订单'),
    tabActive: pick(locale, 'В работе', '进行中'),
    tabCompleted: pick(locale, 'Завершённые', '已完成'),
  };
}

export function adminOrderDetailStrings(locale: AdminLocale) {
  return {
    backList: pick(locale, '← К списку заказов', '← 返回订单列表'),
    title: pick(locale, 'Заказ', '订单'),
    errLoad: pick(locale, 'Не удалось загрузить заказ', '无法加载订单'),
    notFound: pick(locale, 'Заказ не найден', '未找到订单'),
    sectionClient: pick(locale, 'Клиент и доставка', '客户与配送'),
    sectionItems: pick(locale, 'Состав заказа', '订单明细'),
    sectionComment: pick(locale, 'Комментарий', '备注'),
    sectionDocs: pick(locale, 'Документы', '文档'),
    sectionMeta: pick(locale, 'Реквизиты', '信息'),
    labelStatus: pick(locale, 'Статус', '状态'),
    labelCreated: pick(locale, 'Создан', '创建于'),
    labelUpdated: pick(locale, 'Обновлён', '更新于'),
    labelAccount: pick(locale, 'Клиент', '客户'),
    labelEmail: pick(locale, 'Email', 'Email'),
    labelPhone: pick(locale, 'Телефон', '电话'),
    labelTotal: pick(locale, 'Сумма', '合计'),
    labelCurrency: pick(locale, 'Валюта', '货币'),
    labelFio: pick(locale, 'ФИО заказчика', '收货人姓名'),
    labelAddress: pick(locale, 'Адрес доставки', '配送地址'),
    save: pick(locale, 'Сохранить статус', '保存状态'),
    saving: pick(locale, 'Сохранение…', '保存中…'),
    errSaveStatus: pick(locale, 'Не удалось сохранить статус', '无法保存状态'),
    openProduct: pick(locale, 'Товар в каталоге', '在目录中打开'),
    thProduct: pick(locale, 'Товар', '商品'),
    thQtyUnit: pick(locale, 'Кол-во', '数量'),
    thQty: pick(locale, 'Кол-во', '数量'),
    thUnit: pick(locale, 'Ед.', '单位'),
    thPrice: pick(locale, 'Цена', '单价'),
    thLineTotal: pick(locale, 'Сумма', '小计'),
    noItems: pick(locale, 'Нет позиций', '无明细'),
    emptyComment: pick(locale, '—', '—'),
    noDocs: pick(locale, 'Нет прикреплённых ссылок', '无附件链接'),
    snapshotModification: pick(locale, 'Модификация', '配置'),
    snapshotElementFallback: pick(locale, 'Элемент', '部件'),
    chatAsideAria: pick(locale, 'Чат и записки по заказу', '订单沟通与备注'),
    chatTitle: pick(locale, 'Чат', '沟通'),
    tabChat: pick(locale, 'Чат', '聊天'),
    tabNotes: pick(locale, 'Записки', '备注'),
    notesPlaceholder: pick(locale, 'Внутренние заметки по заказу…', '内部订单备注…'),
    notesHint: pick(locale, 'Видно только в админке; сохранение на сервере — позже.', '仅管理端可见；稍后支持服务端保存。'),
    chatPlaceholder: pick(locale, 'Сообщение…', '消息…'),
    chatEmpty: pick(locale, 'Пока нет сообщений', '暂无消息'),
    chatLoadOlder: pick(locale, 'Показать раньше', '更早消息'),
    footerSumLabel: pick(locale, 'Сумма', '合计'),
    actionPrepareCp: pick(locale, 'Сформировать КП', '生成报价单'),
    actionCancelOrder: pick(locale, 'Удалить заявку', '删除申请'),
    actionsHintPrepareCp: pick(locale, '', ''),
    cancelModalReminder: pick(
      locale,
      'Перед удалением напишите в чате справа причину — клиент увидит её в личном кабинете.',
      '删除前请在右侧沟通栏写明原因，客户将在个人中心看到。',
    ),
    cancelModalTitle: pick(locale, 'Удалить заявку на согласовании?', '要删除此待审批申请吗？'),
    cancelModalConfirm: pick(locale, 'Удалить', '删除'),
    cancelModalCancel: pick(locale, 'Отмена', '取消'),
    errDeleteOrder: pick(locale, 'Не удалось удалить заказ', '删除失败'),
    statusPendingHint: pick(
      locale,
      'Заказ на согласовании. После публикации КП можно перевести на следующий этап.',
      '订单待审批。发布报价后可进入下一阶段。',
    ),
    kpPublish: pick(locale, 'Отправить', '发送'),
    kpPublishing: pick(locale, 'Отправка…', '发送中…'),
    kpNotSentYet: pick(locale, 'Предложение ещё не отправлено', '报价尚未发送'),
    kpQtyPieces: pick(locale, 'Кол-во (шт)', '数量（件）'),
    kpColumnActions: pick(locale, 'Действия', '操作'),
    kpBtnReplace: pick(locale, 'Заменить товар', '更换商品'),
    kpPublishConfirmTitle: pick(locale, 'Отправить предложение клиенту?', '向客户发送此报价？'),
    kpPublishConfirmCancel: pick(locale, 'Отмена', '取消'),
    kpPublishConfirmSubmit: pick(locale, 'Отправить', '发送'),
    kpPublishConfirmSending: pick(locale, 'Отправка…', '发送中…'),
    kpPublishSummaryHeading: pick(locale, 'Итог', '摘要'),
    kpPublishPositions: (n: number) => pick(locale, `Позиций: ${n}`, `${n} 项`),
    kpPublishNextStatus: pick(locale, 'Статус заказа после отправки', '发送后的订单状态'),
    kpSectionPublished: pick(locale, 'Отправленные КП', '已发送报价单'),
    kpPublishedLoading: pick(locale, 'Загрузка КП…', '加载报价中…'),
    kpPublishedNone: pick(
      locale,
      'Отправленных коммерческих предложений пока нет.',
      '暂无已发送的报价单。',
    ),
    kpPublishedVersionCaption: (
      versionNumber: number,
      publishedAtFormatted: string,
      positionsLabel: string,
    ) =>
      pick(
        locale,
        `Версия ${versionNumber} · отправлено ${publishedAtFormatted} · ${positionsLabel}`,
        `第 ${versionNumber} 版 · ${publishedAtFormatted} · ${positionsLabel}`,
      ),
    kpDiscountLabel: pick(locale, 'Скидка', '折扣'),
    kpPublishedDetailError: pick(
      locale,
      'Не удалось загрузить строки опубликованного КП. Обновите страницу.',
      '报价明细加载失败，请刷新页面。',
    ),
  };
}
