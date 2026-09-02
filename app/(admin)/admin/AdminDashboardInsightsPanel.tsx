'use client';

import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import type { adminDashboardAnalyticsStrings } from '@/lib/admin-i18n/adminDashboardAnalyticsI18n';
import type { DashboardInsight } from '@/lib/admin-i18n/adminDashboardInsightsI18n';
import { ASSISTANT_EMOJI, ASSISTANT_OPEN_EVENT } from './AdminAssistantPanel';
import styles from './AdminDashboard.module.css';

type Strings = ReturnType<typeof adminDashboardAnalyticsStrings>;

type Props = {
  s: Strings;
  insights: DashboardInsight[];
  metricsLoading: boolean;
  collapsed: boolean;
  canAssistant: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

function openAssistantChat() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ASSISTANT_OPEN_EVENT));
}

export function AdminDashboardInsightsPanel({
  s,
  insights,
  metricsLoading,
  collapsed,
  canAssistant,
  onCollapsedChange,
}: Props) {
  return (
    <aside
      className={`${styles.insightsPanel} ${collapsed ? styles.insightsPanelCollapsed : ''}`}
      aria-label={s.assistantTitle}
    >
      {collapsed ? (
        <button
          type="button"
          className={`${styles.insightsToggle} ${styles.insightsExpandHit}`}
          aria-expanded={false}
          aria-label={s.assistantExpand}
          onClick={() => onCollapsedChange(false)}
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
              onClick={() => onCollapsedChange(true)}
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
  );
}
