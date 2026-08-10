import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export function adminProductQaQueueStrings(locale: AdminLocale) {
  return {
    pageTitle: pick(locale, 'Публичные чаты', '公开聊天'),
    loading: pick(locale, 'Загрузка…', '加载中…'),
    loadError: pick(locale, 'Не удалось загрузить чаты', '无法加载聊天'),
    retry: pick(locale, 'Повторить', '重试'),
    empty: pick(locale, 'Пока нет чатов по товарам', '暂无商品聊天'),
    loadMore: pick(locale, 'Показать ещё', '加载更多'),
    loadMoreBusy: pick(locale, 'Загрузка…', '加载中…'),
    closeOverlay: pick(locale, 'Закрыть', '关闭'),
    chatChannelTabs: pick(locale, 'Канал чата', '聊天频道'),
    tabCorrespondence: pick(locale, 'Переписка', '私信'),
    tabQa: pick(locale, 'Витрина Q&A', '公开 Q&A'),
    badgeAwaitingReply: pick(locale, 'Ожидает ответа', '待回复'),
    badgeUnpublished: (n: number) =>
      pick(locale, `${n} не на витрине`, `${n} 条未上架`),
    badgePendingModeration: (n: number) =>
      pick(locale, `${n} на модерации`, `${n} 条待审核`),
  };
}
