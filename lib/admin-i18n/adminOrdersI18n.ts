import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminOrderStatusLabels(locale: AdminLocale): Record<string, string> {
  if (locale === 'zh') {
    return { ORDERED: '已下单', PAID: '已付款', RECEIVED: '已收货' };
  }
  return { ORDERED: 'Заказано', PAID: 'Оплачено', RECEIVED: 'Получено' };
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
