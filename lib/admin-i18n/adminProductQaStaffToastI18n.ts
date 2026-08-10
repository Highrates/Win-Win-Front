import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminProductQaStaffToastStrings(locale: AdminLocale) {
  return {
    title: pick(locale, 'Новый вопрос по товару', '新商品提问'),
    openProduct: pick(locale, 'Открыть товар', '打开商品'),
    dismiss: pick(locale, 'Закрыть', '关闭'),
  };
}

export function adminProductQaUnreadBadgeTitle(locale: AdminLocale): string {
  return pick(locale, 'Непрочитанные вопросы по товарам', '未读商品提问');
}
