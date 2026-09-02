import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';
import { catalogHasHygieneHole, type DashboardData } from '@/lib/adminDashboard/dashboardData';
import {
  formatPeriodRange,
  type DashboardPeriodPreset,
} from '@/lib/adminDashboard/dashboardPeriod';

const pick = <T,>(locale: AdminLocale, ru: T, zh: T): T => (locale === 'zh' ? zh : ru);

export type DashboardPeriodCopy = {
  /** Для скобок / суффикса: «сегодня», «в этом месяце», «01.09 – 02.09». */
  paren: string;
  /** Для фразы «… нет заказов»: «За сегодня» / «В этом месяце» / «За 01.09 – 02.09». */
  emptyPrefix: string;
};

export type DashboardInsight = { icon: string; text: string };

export function buildDashboardPeriodCopy(
  preset: DashboardPeriodPreset,
  locale: AdminLocale,
  appliedFrom: string,
  appliedTo: string,
): DashboardPeriodCopy {
  if (preset === 'today') {
    return pick(
      locale,
      { paren: 'сегодня', emptyPrefix: 'За сегодня' },
      { paren: '今天', emptyPrefix: '今天' },
    );
  }
  if (preset === 'month') {
    return pick(
      locale,
      { paren: 'в этом месяце', emptyPrefix: 'В этом месяце' },
      { paren: '本月', emptyPrefix: '本月' },
    );
  }
  const range = formatPeriodRange(appliedFrom, appliedTo);
  return pick(
    locale,
    { paren: range, emptyPrefix: `За ${range}` },
    { paren: range, emptyPrefix: range },
  );
}

function insightStrings(locale: AdminLocale) {
  return {
    loadFailed: pick(
      locale,
      'Не удалось загрузить сводку — обновите период или повторите.',
      '无法加载汇总 — 请更换时间段或重试。',
    ),
    ordersPending: (n: number, paren: string) =>
      pick(
        locale,
        `${n} заказ(ов) на согласовании (${paren}).`,
        `${n} 个订单待确认（${paren}）。`,
      ),
    ordersActiveOnly: (n: number) =>
      pick(
        locale,
        `${n} заказ(ов) в работе, новых на согласовании нет.`,
        `${n} 个订单进行中，暂无新单。`,
      ),
    ordersEmpty: (emptyPrefix: string) =>
      pick(
        locale,
        `${emptyPrefix} нет новых и активных заказов.`,
        `${emptyPrefix}暂无新单和进行中订单。`,
      ),
    sourcingPending: (n: number) =>
      pick(locale, `${n} заявк(и) на подбор ждут разбора.`, `${n} 个采购申请待审。`),
    qaUnread: (n: number) =>
      pick(
        locale,
        `В Q&A ${n} непрочитанных — стоит глянуть очередь.`,
        `Q&A 有 ${n} 条未读。`,
      ),
    ordersChat: (n: number) =>
      pick(
        locale,
        `В чатах заказов ${n} непрочитанных от клиентов.`,
        `订单聊天有 ${n} 条未读客户消息。`,
      ),
    partnersNew: (n: number) =>
      pick(locale, `${n} заявк(и) партнёров ждут решения.`, `${n} 个合作伙伴申请待处理。`),
    signupsNew: (n: number, paren: string) =>
      pick(locale, `${n} новых пользователей ${paren}.`, `${paren}新增 ${n} 位用户。`),
    catalogHygiene: pick(
      locale,
      'В каталоге есть карточки с дырами в модификациях/элементах — стоит пройтись по блоку «Каталог».',
      '目录有卡片结构缺口（修改项/部件）— 建议先看仪表盘「目录」。',
    ),
    allQuiet: pick(
      locale,
      'За период всё спокойно. Можно спросить ассистента про детали.',
      '该时段暂无紧急事项。可向助手提问细节。',
    ),
  };
}

export function buildAssistantInsights(
  data: DashboardData,
  loading: boolean,
  locale: AdminLocale,
  period: DashboardPeriodCopy,
): DashboardInsight[] {
  if (loading) return [];
  const t = insightStrings(locale);
  const hasAny =
    data.orders != null ||
    data.sourcing != null ||
    data.qaUnread != null ||
    data.ordersChat != null ||
    data.partners != null ||
    data.signups != null ||
    data.catalog != null;
  if (!hasAny) {
    return [{ icon: '⚠️', text: t.loadFailed }];
  }

  const items: DashboardInsight[] = [];

  if (data.orders) {
    if (data.orders.new > 0) {
      items.push({ icon: '🔔', text: t.ordersPending(data.orders.new, period.paren) });
    } else if (data.orders.active > 0) {
      items.push({ icon: '✅', text: t.ordersActiveOnly(data.orders.active) });
    } else {
      items.push({ icon: '📭', text: t.ordersEmpty(period.emptyPrefix) });
    }
  }

  if (data.sourcing && data.sourcing.pendingReview > 0) {
    items.push({ icon: '🔍', text: t.sourcingPending(data.sourcing.pendingReview) });
  }

  if (data.qaUnread != null && data.qaUnread > 0) {
    items.push({ icon: '💬', text: t.qaUnread(data.qaUnread) });
  }

  if (data.ordersChat && data.ordersChat.total > 0) {
    items.push({ icon: '✉️', text: t.ordersChat(data.ordersChat.total) });
  }

  if (data.partners && data.partners.new > 0) {
    items.push({ icon: '🤝', text: t.partnersNew(data.partners.new) });
  }

  if (data.signups && data.signups.new > 0) {
    items.push({ icon: '🌱', text: t.signupsNew(data.signups.new, period.paren) });
  }

  if (data.catalog && catalogHasHygieneHole(data.catalog)) {
    items.push({ icon: '🗂', text: t.catalogHygiene });
  }

  if (items.length === 0) {
    items.push({ icon: '✨', text: t.allQuiet });
  }

  return items.slice(0, 4);
}
