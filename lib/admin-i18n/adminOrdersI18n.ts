import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminOrderStatusLabels(locale: AdminLocale): Record<string, string> {
  if (locale === 'zh') {
    return {
      DRAFT: '草稿',
      PENDING_APPROVAL: '待审批',
      ORDERED: '已下单',
      PAID: '已付款',
      RECEIVED: '已收货',
    };
  }
  return {
    DRAFT: 'Черновик',
    PENDING_APPROVAL: 'На согласовании',
    ORDERED: 'Заказано',
    PAID: 'Оплачено',
    RECEIVED: 'Получено',
  };
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
    loading: pick(locale, 'Загрузка…', '加载中…'),
    empty: pick(locale, 'Нет заказов', '暂无订单'),
    itemsCount: (n: number) => pick(locale, `${n} поз.`, `${n} 项`),
    save: pick(locale, 'Сохранить', '保存'),
    saving: pick(locale, '…', '…'),
    back: pick(locale, 'Назад', '上一页'),
    pageOf: (page: number, totalPages: number, total: number) =>
      pick(locale, `Стр. ${page} из ${totalPages} (${total})`, `第 ${page} / ${totalPages} 页（${total}）`),
    forward: pick(locale, 'Вперёд', '下一页'),
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
    labelUserId: pick(locale, 'ID пользователя', '用户 ID'),
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
    thQty: pick(locale, 'Кол-во', '数量'),
    thUnit: pick(locale, 'Ед.', '单位'),
    thPrice: pick(locale, 'Цена', '单价'),
    thLineTotal: pick(locale, 'Сумма', '小计'),
    noItems: pick(locale, 'Нет позиций', '无明细'),
    emptyComment: pick(locale, '—', '—'),
    noDocs: pick(locale, 'Нет прикреплённых ссылок', '无附件链接'),
    snapshotModification: pick(locale, 'Модификация', '配置'),
    snapshotElementFallback: pick(locale, 'Элемент', '部件'),
  };
}
