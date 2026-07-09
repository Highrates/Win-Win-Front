'use client';

import type { ReactNode } from 'react';
import styles from '@/app/(admin)/admin/layout.module.css';

export function AdminPermissionsLoadingShell({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.body}>
        <aside className={styles.sidebar} aria-hidden="true">
          <div className={styles.skeletonBrand} />
          <div className={styles.skeletonNav}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonNavItem} />
            ))}
          </div>
        </aside>
        <div className={styles.content}>
          {children ?? (
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
