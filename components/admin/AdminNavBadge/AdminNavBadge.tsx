'use client';

import styles from '@/app/(admin)/admin/layout.module.css';

type AdminNavBadgeProps = {
  count: number;
  title: string;
  variant?: 'paren' | 'bracket';
};

export function AdminNavBadge({ count, title, variant = 'paren' }: AdminNavBadgeProps) {
  if (count <= 0) return null;
  const formatted = variant === 'bracket' ? ` [${count}]` : ` (${count})`;
  return (
    <span className={styles.navLinkCount} title={title}>
      {formatted}
    </span>
  );
}
