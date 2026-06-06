import styles from './AdminTabs.module.css';

export type AdminTabItem<T extends string | number = string> = {
  id: T;
  label: React.ReactNode;
  'aria-label'?: string;
};

export type AdminTabsProps<T extends string | number = string> = {
  items: AdminTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  variant?: 'underline' | 'pill';
  /** Меньший отступ снизу (как у scope-tabs на /admin/objects). */
  compact?: boolean;
  className?: string;
};

/** Единые табы админки: underline (разделы) или pill (фильтры). */
export function AdminTabs<T extends string | number = string>({
  items,
  activeId,
  onChange,
  ariaLabel,
  variant = 'underline',
  compact = false,
  className,
}: AdminTabsProps<T>) {
  const isPill = variant === 'pill';
  const rootClass = isPill
    ? styles.rootPill
    : `${styles.rootUnderline} ${compact ? styles.rootUnderlineCompact : ''}`.trim();

  return (
    <div className={`${rootClass} ${className ?? ''}`.trim()} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.id === activeId;
        const tabClass = isPill
          ? `${styles.tabPill} ${active ? styles.tabPillActive : ''}`.trim()
          : `${styles.tabUnderline} ${active ? styles.tabUnderlineActive : ''}`.trim();
        return (
          <button
            key={String(item.id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={item['aria-label']}
            className={tabClass}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function AdminTabsPanel({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'main';
}) {
  return <Tag className={`${styles.panel} ${className ?? ''}`.trim()}>{children}</Tag>;
}

export function AdminTabsLead({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <p id={id} className={`${styles.lead} ${className ?? ''}`.trim()}>
      {children}
    </p>
  );
}
