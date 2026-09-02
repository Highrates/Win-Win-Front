'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { staffCanAssistant } from '@win-win/admin-sections';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { adminDashboardStrings } from '@/lib/admin-i18n/adminChromeI18n';
import { adminDashboardAnalyticsStrings } from '@/lib/admin-i18n/adminDashboardAnalyticsI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminPermissions } from '@/lib/adminPermissions/AdminPermissionsProvider';
import {
  fetchCatalogDashboardSummary,
  fetchOrdersChatUnreadSummary,
  fetchOrdersDashboardSummary,
  fetchPartnersDashboardSummary,
  fetchQaUnreadSummary,
  fetchSignupDashboardSummary,
  fetchSourcingDashboardSummary,
  type CatalogDashboardSummary,
  type OrdersChatUnreadSummary,
  type OrdersDashboardSummary,
  type PartnersDashboardSummary,
  type SignupDashboardSummary,
  type SourcingDashboardSummary,
} from '@/lib/adminDashboard/adminDashboardApi';
import {
  parseDateInputValue,
  rangeForPreset,
  rangeFromInclusiveDays,
  toDateInputValue,
  type DashboardDateRange,
  type DashboardPeriodPreset,
} from '@/lib/adminDashboard/dashboardPeriod';
import catalogStyles from './catalog/catalogAdmin.module.css';
import { ASSISTANT_EMOJI, ASSISTANT_OPEN_EVENT } from './AdminAssistantPanel';
import styles from './AdminDashboard.module.css';

type DashboardData = {
  orders: OrdersDashboardSummary | null;
  sourcing: SourcingDashboardSummary | null;
  qaUnread: number | null;
  ordersChat: OrdersChatUnreadSummary | null;
  partners: PartnersDashboardSummary | null;
  signups: SignupDashboardSummary | null;
  catalog: CatalogDashboardSummary | null;
};

type Insight = { icon: string; text: string };

const EMPTY: DashboardData = {
  orders: null,
  sourcing: null,
  qaUnread: null,
  ordersChat: null,
  partners: null,
  signups: null,
  catalog: null,
};

function formatYmdRu(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  if (!y || !m || !d) return ymd;
  return `${d}.${m}.${y}`;
}

function formatPeriodRange(fromYmd: string, toYmd: string): string {
  if (fromYmd === toYmd) return formatYmdRu(fromYmd);
  return `${formatYmdRu(fromYmd)} – ${formatYmdRu(toYmd)}`;
}

function startOfCompare(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function buildAssistantInsights(
  data: DashboardData,
  loading: boolean,
  locale: 'ru' | 'zh',
  periodLabel: string,
): Insight[] {
  if (loading) return [];
  const zh = locale === 'zh';
  const hasAny =
    data.orders != null ||
    data.sourcing != null ||
    data.qaUnread != null ||
    data.ordersChat != null ||
    data.partners != null ||
    data.signups != null ||
    data.catalog != null;
  if (!hasAny) {
    return [
      {
        icon: '⚠️',
        text: zh
          ? '无法加载汇总 — 请更换时间段或重试。'
          : 'Не удалось загрузить сводку — обновите период или повторите.',
      },
    ];
  }

  const items: Insight[] = [];

  if (data.orders) {
    if (data.orders.new > 0) {
      items.push({
        icon: '🔔',
        text: zh
          ? `${data.orders.new} 个订单待确认（${periodLabel}）。`
          : `${data.orders.new} заказ(ов) на согласовании (${periodLabel}).`,
      });
    } else if (data.orders.active > 0) {
      items.push({
        icon: '✅',
        text: zh
          ? `${data.orders.active} 个订单进行中，暂无新单。`
          : `${data.orders.active} заказ(ов) в работе, новых на согласовании нет.`,
      });
    } else {
      items.push({
        icon: '📭',
        text: zh
          ? `该时段暂无新单和进行中订单。`
          : `За ${periodLabel} нет новых и активных заказов.`,
      });
    }
  }

  if (data.sourcing && data.sourcing.pendingReview > 0) {
    items.push({
      icon: '🔍',
      text: zh
        ? `${data.sourcing.pendingReview} 个采购申请待审。`
        : `${data.sourcing.pendingReview} заявк(и) на подбор ждут разбора.`,
    });
  }

  if (data.qaUnread != null && data.qaUnread > 0) {
    items.push({
      icon: '💬',
      text: zh
        ? `Q&A 有 ${data.qaUnread} 条未读。`
        : `В Q&A ${data.qaUnread} непрочитанных — стоит глянуть очередь.`,
    });
  }

  if (data.ordersChat && data.ordersChat.total > 0) {
    items.push({
      icon: '✉️',
      text: zh
        ? `订单聊天有 ${data.ordersChat.total} 条未读客户消息。`
        : `В чатах заказов ${data.ordersChat.total} непрочитанных от клиентов.`,
    });
  }

  if (data.partners && data.partners.new > 0) {
    items.push({
      icon: '🤝',
      text: zh
        ? `${data.partners.new} 个合作伙伴申请待处理。`
        : `${data.partners.new} заявк(и) партнёров ждут решения.`,
    });
  }

  if (data.signups && data.signups.new > 0) {
    items.push({
      icon: '🌱',
      text: zh
        ? `${periodLabel}新增 ${data.signups.new} 位用户。`
        : `${data.signups.new} новых пользователей ${periodLabel}.`,
    });
  }

  if (data.catalog) {
    const holes =
      data.catalog.noModifications +
      data.catalog.noVariants +
      data.catalog.activeEmpty +
      data.catalog.elementEmptyPool +
      data.catalog.compositeIncomplete;
    if (holes > 0) {
      items.push({
        icon: '🗂',
        text: zh
          ? `目录有卡片结构缺口（修改项/部件）— 建议先看仪表盘「目录」。`
          : `В каталоге есть карточки с дырами в модификациях/элементах — стоит пройтись по блоку «Каталог».`,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      icon: '✨',
      text: zh
        ? '该时段暂无紧急事项。可向助手提问细节。'
        : 'За период всё спокойно. Можно спросить ассистента про детали.',
    });
  }

  return items.slice(0, 4);
}

function openAssistantChat() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ASSISTANT_OPEN_EVENT));
}

export function AdminDashboardClient() {
  const { locale } = useAdminLocale();
  const { canAccessSection, loading: permissionsLoading, sections, isSuperAdmin } =
    useAdminPermissions();
  const { title, accessDenied } = adminDashboardStrings(locale);
  const s = adminDashboardAnalyticsStrings(locale);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showDeniedBanner, setShowDeniedBanner] = useState(false);
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const [preset, setPreset] = useState<DashboardPeriodPreset>('today');
  const [range, setRange] = useState<DashboardDateRange>(() => rangeForPreset('today'));
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(() => toDateInputValue(new Date()));
  const [draftTo, setDraftTo] = useState(() => toDateInputValue(new Date()));
  const [appliedFrom, setAppliedFrom] = useState(() => toDateInputValue(new Date()));
  const [appliedTo, setAppliedTo] = useState(() => toDateInputValue(new Date()));
  const [insightsCollapsed, setInsightsCollapsed] = useState(false);
  const periodMenuRef = useRef<HTMLDivElement>(null);

  const canOrders = !permissionsLoading && canAccessSection('orders');
  const canCatalog = !permissionsLoading && canAccessSection('catalog');
  const canApplications = !permissionsLoading && canAccessSection('applications');
  const canClients = !permissionsLoading && canAccessSection('clients');
  const canAssistant =
    !permissionsLoading && staffCanAssistant(sections, isSuperAdmin);
  const showMetrics = canOrders || canCatalog || canApplications || canClients;

  const customPending = draftFrom !== appliedFrom || draftTo !== appliedTo;

  useEffect(() => {
    if (searchParams.get('denied') === '1') {
      setShowDeniedBanner(true);
      router.replace('/admin');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!periodMenuOpen) return;
    const onPointer = (e: MouseEvent) => {
      const el = periodMenuRef.current;
      if (el && !el.contains(e.target as Node)) setPeriodMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPeriodMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [periodMenuOpen]);

  const selectPreset = (next: 'today' | 'month') => {
    const nextRange = rangeForPreset(next);
    setPreset(next);
    setPeriodMenuOpen(false);
    setRange(nextRange);
    setAppliedFrom(toDateInputValue(nextRange.from));
    const lastInclusive = new Date(nextRange.to);
    lastInclusive.setDate(lastInclusive.getDate() - 1);
    setAppliedTo(toDateInputValue(lastInclusive));
  };

  const openPeriodMenu = () => {
    setDraftFrom(appliedFrom);
    setDraftTo(appliedTo);
    setPeriodMenuOpen(true);
  };

  const applyCustomRange = () => {
    const from = parseDateInputValue(draftFrom);
    const to = parseDateInputValue(draftTo);
    if (!from || !to || startOfCompare(from) > startOfCompare(to)) return;
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
    setPreset('custom');
    setRange(rangeFromInclusiveDays(from, to));
    setPeriodMenuOpen(false);
  };

  const loadMetrics = useCallback(async () => {
    if (permissionsLoading || !showMetrics) {
      setData(EMPTY);
      setMetricsLoading(false);
      setMetricsError(null);
      return;
    }
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const next: DashboardData = { ...EMPTY };
      const tasks: Array<Promise<void>> = [];
      let failed = 0;

      if (canOrders) {
        tasks.push(
          fetchOrdersDashboardSummary(range)
            .then((orders) => {
              next.orders = orders;
            })
            .catch(() => {
              failed += 1;
            }),
          fetchSourcingDashboardSummary(range)
            .then((sourcing) => {
              next.sourcing = sourcing;
            })
            .catch(() => {
              failed += 1;
            }),
          fetchOrdersChatUnreadSummary()
            .then((ordersChat) => {
              next.ordersChat = ordersChat;
            })
            .catch(() => {
              failed += 1;
            }),
        );
      }
      if (canCatalog) {
        tasks.push(
          fetchQaUnreadSummary(range)
            .then((j) => {
              next.qaUnread = typeof j.total === 'number' ? j.total : 0;
            })
            .catch(() => {
              failed += 1;
            }),
          fetchCatalogDashboardSummary()
            .then((catalog) => {
              next.catalog = catalog;
            })
            .catch(() => {
              failed += 1;
            }),
        );
      }
      if (canApplications) {
        tasks.push(
          fetchPartnersDashboardSummary(range)
            .then((partners) => {
              next.partners = partners;
            })
            .catch(() => {
              failed += 1;
            }),
        );
      }
      if (canClients) {
        tasks.push(
          fetchSignupDashboardSummary(range)
            .then((signups) => {
              next.signups = signups;
            })
            .catch(() => {
              failed += 1;
            }),
        );
      }

      await Promise.all(tasks);
      setData(next);
      if (failed > 0) setMetricsError(s.loadError);
    } catch {
      setMetricsError(s.loadError);
      setData(EMPTY);
    } finally {
      setMetricsLoading(false);
    }
  }, [
    canApplications,
    canCatalog,
    canClients,
    canOrders,
    permissionsLoading,
    range,
    s.loadError,
    showMetrics,
  ]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  const periodLabel =
    preset === 'today'
      ? locale === 'zh'
        ? '今天'
        : 'сегодня'
      : preset === 'month'
        ? locale === 'zh'
          ? '本月'
          : 'в этом месяце'
        : locale === 'zh'
          ? `在 ${formatPeriodRange(appliedFrom, appliedTo)}`
          : `за ${formatPeriodRange(appliedFrom, appliedTo)}`;

  const insights = useMemo(
    () => buildAssistantInsights(data, metricsLoading, locale, periodLabel),
    [data, metricsLoading, locale, periodLabel],
  );

  const customChipLabel =
    preset === 'custom' ? formatPeriodRange(appliedFrom, appliedTo) : s.chipPeriod;

  const kpiBusy = permissionsLoading || metricsLoading;

  return (
    <main>
      {showDeniedBanner ? (
        <div className={catalogStyles.errorBanner} role="alert">
          <span>{accessDenied}</span>
          <button
            type="button"
            className={catalogStyles.errorBannerDismiss}
            onClick={() => setShowDeniedBanner(false)}
            aria-label={locale === 'zh' ? '关闭' : 'Закрыть'}
          >
            ×
          </button>
        </div>
      ) : null}
      <h1 className={catalogStyles.title}>{title}</h1>

      {permissionsLoading ? <p className={catalogStyles.lead}>{s.loading}</p> : null}

      {!permissionsLoading && showMetrics ? (
        <section aria-label={title}>
          <div className={styles.periodBar}>
            <div className={styles.periodChips} role="radiogroup" aria-label={s.chipPeriod}>
              <AdminCompactBtn
                type="button"
                role="radio"
                aria-checked={preset === 'today'}
                variant={preset === 'today' ? 'accent' : 'outline'}
                onClick={() => selectPreset('today')}
              >
                {s.chipToday}
              </AdminCompactBtn>
              <AdminCompactBtn
                type="button"
                role="radio"
                aria-checked={preset === 'month'}
                variant={preset === 'month' ? 'accent' : 'outline'}
                onClick={() => selectPreset('month')}
              >
                {s.chipMonth}
              </AdminCompactBtn>

              <div className={styles.periodChipWrap} ref={periodMenuRef}>
                <AdminCompactBtn
                  type="button"
                  role="radio"
                  aria-checked={preset === 'custom'}
                  aria-expanded={periodMenuOpen}
                  aria-haspopup="dialog"
                  variant={preset === 'custom' ? 'accent' : 'outline'}
                  onClick={() => {
                    if (periodMenuOpen) setPeriodMenuOpen(false);
                    else openPeriodMenu();
                  }}
                >
                  {customChipLabel}
                </AdminCompactBtn>

                {periodMenuOpen ? (
                  <div className={styles.periodPopover} role="dialog" aria-label={s.chipPeriod}>
                    <label className={styles.periodDateField}>
                      <span className={styles.periodDateLabel}>{s.periodFrom}</span>
                      <input
                        className={styles.periodDateInput}
                        type="date"
                        value={draftFrom}
                        max={draftTo}
                        onChange={(e) => setDraftFrom(e.target.value)}
                      />
                    </label>
                    <label className={styles.periodDateField}>
                      <span className={styles.periodDateLabel}>{s.periodTo}</span>
                      <input
                        className={styles.periodDateInput}
                        type="date"
                        value={draftTo}
                        min={draftFrom}
                        onChange={(e) => setDraftTo(e.target.value)}
                      />
                    </label>
                    <div className={styles.periodPopoverActions}>
                      <AdminCompactBtn
                        type="button"
                        variant="outline"
                        onClick={() => setPeriodMenuOpen(false)}
                      >
                        {locale === 'zh' ? '取消' : 'Отмена'}
                      </AdminCompactBtn>
                      <AdminCompactBtn
                        type="button"
                        variant="accent"
                        disabled={
                          !draftFrom ||
                          !draftTo ||
                          (!customPending && preset === 'custom') ||
                          metricsLoading
                        }
                        onClick={applyCustomRange}
                      >
                        {s.periodApply}
                      </AdminCompactBtn>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {metricsError ? (
            <div className={catalogStyles.errorBanner} role="alert">
              <span>{metricsError}</span>
              <button
                type="button"
                className={catalogStyles.errorBannerDismiss}
                onClick={() => void loadMetrics()}
              >
                {s.retry}
              </button>
            </div>
          ) : null}

          <div
            className={`${styles.summaryRow} ${
              insightsCollapsed ? styles.summaryRowCollapsed : ''
            }`}
          >
            <div className={styles.kpiGrid} aria-busy={kpiBusy}>
              {canOrders ? (
                <article className={styles.kpi} aria-label={s.ordersTitle}>
                  <div className={styles.kpiHead}>
                    <h2 className={styles.kpiTitle}>{s.ordersTitle}</h2>
                  </div>
                  <div className={styles.blockMeta}>
                    <Link href="/admin/orders?bucket=new" className={styles.blockMetaItem}>
                      <span className={styles.blockMetaValue}>
                        {kpiBusy || !data.orders ? '…' : data.orders.new}
                      </span>
                      <span className={styles.blockMetaLabel}>{s.ordersNew}</span>
                    </Link>
                    <Link href="/admin/orders?bucket=active" className={styles.blockMetaItem}>
                      <span className={styles.blockMetaValue}>
                        {kpiBusy || !data.orders ? '…' : data.orders.active}
                      </span>
                      <span className={styles.blockMetaLabel}>{s.ordersActive}</span>
                    </Link>
                  </div>
                </article>
              ) : null}

              {canOrders ? (
                <article className={styles.kpi} aria-label={s.sourcingTitle}>
                  <div className={styles.kpiHead}>
                    <h2 className={styles.kpiTitle}>{s.sourcingTitle}</h2>
                  </div>
                  <div className={styles.blockMeta}>
                    <Link
                      href="/admin/orders?section=sourcing&bucket=new"
                      className={styles.blockMetaItem}
                    >
                      <span className={styles.blockMetaValue}>
                        {kpiBusy || !data.sourcing ? '…' : data.sourcing.pendingReview}
                      </span>
                      <span className={styles.blockMetaLabel}>{s.sourcingPending}</span>
                    </Link>
                    <Link
                      href="/admin/orders?section=sourcing&bucket=active"
                      className={styles.blockMetaItem}
                    >
                      <span className={styles.blockMetaValue}>
                        {kpiBusy || !data.sourcing ? '…' : data.sourcing.inProgress}
                      </span>
                      <span className={styles.blockMetaLabel}>{s.sourcingInProgress}</span>
                    </Link>
                  </div>
                </article>
              ) : null}

              {canOrders ? (
                <article className={styles.kpi} aria-label={s.chatTitle}>
                  <div className={styles.kpiHead}>
                    <h2 className={styles.kpiTitle}>{s.chatTitle}</h2>
                  </div>
                  <div className={styles.blockMeta}>
                    <Link href="/admin/orders?bucket=new" className={styles.blockMetaItem}>
                      <span className={styles.blockMetaValue}>
                        {kpiBusy || !data.ordersChat ? '…' : data.ordersChat.new}
                      </span>
                      <span className={styles.blockMetaLabel}>{s.chatNew}</span>
                    </Link>
                    <Link href="/admin/orders?bucket=active" className={styles.blockMetaItem}>
                      <span className={styles.blockMetaValue}>
                        {kpiBusy || !data.ordersChat ? '…' : data.ordersChat.active}
                      </span>
                      <span className={styles.blockMetaLabel}>{s.chatActive}</span>
                    </Link>
                  </div>
                </article>
              ) : null}

              {canCatalog ? (
                <article className={styles.kpi} aria-label={s.qaTitle}>
                  <div className={styles.kpiHead}>
                    <h2 className={styles.kpiTitle}>{s.qaTitle}</h2>
                  </div>
                  <div className={styles.blockMeta}>
                    <Link href="/admin/catalog/qa-queue" className={styles.blockMetaItem}>
                      <span className={styles.blockMetaValue}>
                        {kpiBusy || data.qaUnread == null ? '…' : data.qaUnread}
                      </span>
                      <span className={styles.blockMetaLabel}>{s.qaUnread}</span>
                    </Link>
                  </div>
                </article>
              ) : null}

              {canApplications ? (
                <article className={styles.kpi} aria-label={s.partnersTitle}>
                  <div className={styles.kpiHead}>
                    <h2 className={styles.kpiTitle}>{s.partnersTitle}</h2>
                  </div>
                  <div className={styles.blockMeta}>
                    <Link href="/admin/applications" className={styles.blockMetaItem}>
                      <span className={styles.blockMetaValue}>
                        {kpiBusy || !data.partners ? '…' : data.partners.new}
                      </span>
                      <span className={styles.blockMetaLabel}>{s.partnersNew}</span>
                    </Link>
                  </div>
                </article>
              ) : null}

              {canClients ? (
                <article className={styles.kpi} aria-label={s.usersTitle}>
                  <div className={styles.kpiHead}>
                    <h2 className={styles.kpiTitle}>{s.usersTitle}</h2>
                  </div>
                  <div className={styles.blockMeta}>
                    <Link href="/admin/clients" className={styles.blockMetaItem}>
                      <span className={styles.blockMetaValue}>
                        {kpiBusy || !data.signups ? '…' : data.signups.new}
                      </span>
                      <span className={styles.blockMetaLabel}>{s.usersNew}</span>
                    </Link>
                  </div>
                </article>
              ) : null}
            </div>

            <aside
              className={`${styles.insightsPanel} ${
                insightsCollapsed ? styles.insightsPanelCollapsed : ''
              }`}
              aria-label={s.assistantTitle}
            >
              {insightsCollapsed ? (
                <button
                  type="button"
                  className={`${styles.insightsToggle} ${styles.insightsExpandHit}`}
                  aria-expanded={false}
                  aria-label={s.assistantExpand}
                  onClick={() => setInsightsCollapsed(false)}
                >
                  <span className={styles.insightsCollapsedLabel}>
                    {ASSISTANT_EMOJI} {s.assistantTitle}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M9 2L5 7L9 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                <>
                  <div className={styles.insightsHead}>
                    <p className={styles.insightsTitle}>
                      {ASSISTANT_EMOJI} {s.assistantTitle}
                    </p>
                    <button
                      type="button"
                      className={styles.insightsToggle}
                      aria-expanded
                      aria-label={s.assistantCollapse}
                      onClick={() => setInsightsCollapsed(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path
                          d="M5 2L9 7L5 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  {metricsLoading ? (
                    <p className={styles.insightMuted}>{s.assistantThinking}</p>
                  ) : insights.length === 0 ? (
                    <p className={styles.insightMuted}>{s.assistantEmpty}</p>
                  ) : (
                    <ul className={styles.insightsList}>
                      {insights.map((item) => (
                        <li key={item.text} className={styles.insightItem}>
                          <span className={styles.insightIcon} aria-hidden>
                            {item.icon}
                          </span>
                          <p className={styles.insightText}>{item.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {canAssistant ? (
                    <div className={styles.insightsActions}>
                      <AdminCompactBtn type="button" variant="accent" onClick={openAssistantChat}>
                        {s.assistantAsk}
                      </AdminCompactBtn>
                    </div>
                  ) : null}
                </>
              )}
            </aside>
          </div>

          {canCatalog ? (
            <section className={styles.catalogSection} aria-label={s.catalogTitle}>
              <div className={styles.catalogSectionHead}>
                <h2 className={styles.kpiTitle}>{s.catalogTitle}</h2>
              </div>
              <div className={styles.catalogMetricList}>
                <Link
                  href="/admin/catalog/products?hygiene=no_modifications"
                  className={styles.catalogMetricItem}
                >
                  <div className={styles.catalogMetricTop}>
                    <span className={styles.catalogMetricLabel}>{s.catalogNoMods}</span>
                    <span className={styles.catalogMetricValue}>
                      {kpiBusy || !data.catalog ? '…' : data.catalog.noModifications}
                    </span>
                  </div>
                  <p className={styles.catalogMetricHint}>{s.catalogNoModsHint}</p>
                </Link>
                <Link
                  href="/admin/catalog/products?hygiene=no_variants"
                  className={styles.catalogMetricItem}
                >
                  <div className={styles.catalogMetricTop}>
                    <span className={styles.catalogMetricLabel}>{s.catalogNoVariants}</span>
                    <span className={styles.catalogMetricValue}>
                      {kpiBusy || !data.catalog ? '…' : data.catalog.noVariants}
                    </span>
                  </div>
                  <p className={styles.catalogMetricHint}>{s.catalogNoVariantsHint}</p>
                </Link>
                <Link
                  href="/admin/catalog/products?hygiene=active_empty"
                  className={styles.catalogMetricItem}
                >
                  <div className={styles.catalogMetricTop}>
                    <span className={styles.catalogMetricLabel}>{s.catalogActiveEmpty}</span>
                    <span className={styles.catalogMetricValue}>
                      {kpiBusy || !data.catalog ? '…' : data.catalog.activeEmpty}
                    </span>
                  </div>
                  <p className={styles.catalogMetricHint}>{s.catalogActiveEmptyHint}</p>
                </Link>
                <Link
                  href="/admin/catalog/products?hygiene=element_empty_pool"
                  className={styles.catalogMetricItem}
                >
                  <div className={styles.catalogMetricTop}>
                    <span className={styles.catalogMetricLabel}>{s.catalogElementEmptyPool}</span>
                    <span className={styles.catalogMetricValue}>
                      {kpiBusy || !data.catalog ? '…' : data.catalog.elementEmptyPool}
                    </span>
                  </div>
                  <p className={styles.catalogMetricHint}>{s.catalogElementEmptyPoolHint}</p>
                </Link>
                <Link
                  href="/admin/catalog/products?hygiene=composite_incomplete"
                  className={styles.catalogMetricItem}
                >
                  <div className={styles.catalogMetricTop}>
                    <span className={styles.catalogMetricLabel}>{s.catalogCompositeIncomplete}</span>
                    <span className={styles.catalogMetricValue}>
                      {kpiBusy || !data.catalog ? '…' : data.catalog.compositeIncomplete}
                    </span>
                  </div>
                  <p className={styles.catalogMetricHint}>{s.catalogCompositeIncompleteHint}</p>
                </Link>
              </div>
            </section>
          ) : null}
        </section>
      ) : null}

      {!permissionsLoading && !showMetrics ? (
        <p className={catalogStyles.lead}>
          {locale === 'zh' ? '暂无可用分区。' : 'Нет доступных разделов.'}
        </p>
      ) : null}
    </main>
  );
}
