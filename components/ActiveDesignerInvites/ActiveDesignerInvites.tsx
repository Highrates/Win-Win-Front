'use client';

import { useCallback, useState } from 'react';
import btnStyles from '@/components/Button/Button.module.css';
import profileSheetStyles from '@/app/(site)/(account)/account/profile/page.module.css';
import { copyTextToClipboard } from '@/lib/copyToClipboard';
import {
  formatInviteExpiresLabel,
  type ActiveDesignerInviteApi,
} from '@/lib/designerInvites/activeInvites';
import styles from './ActiveDesignerInvites.module.css';

type ActiveDesignerInvitesProps = {
  items: ActiveDesignerInviteApi[];
  /** Компактный вариант — в одну строку с кнопкой приглашения */
  compact?: boolean;
};

export function ActiveDesignerInvites({ items, compact = false }: ActiveDesignerInvitesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = useCallback(async (item: ActiveDesignerInviteApi) => {
    try {
      await copyTextToClipboard(item.inviteLink);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 3000);
    } catch {
      setCopiedId(null);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section
      className={compact ? styles.wrapCompact : styles.wrap}
      aria-label="Активные приглашения дизайнеров"
    >
      <p className={styles.heading}>
        Ваши приглашения: Ожидают ответа · {items.length}
      </p>
      <ul className={styles.list}>
        {items.map((item) => {
          const expires = formatInviteExpiresLabel(item.expiresAt);
          return (
            <li key={item.id} className={styles.item}>
              <span className={styles.email}>{item.email}</span>
              <span className={styles.meta}>
                Ожидает{expires ? ` · до ${expires}` : ''}
              </span>
              <button
                type="button"
                className={`${btnStyles.btn} ${btnStyles.btnSecondary} ${profileSheetStyles.inviteLinkCopyBtn} ${copiedId === item.id ? profileSheetStyles.inviteLinkCopyBtnDone : ''} ${styles.copyBtn}`}
                onClick={() => {
                  void copyLink(item);
                }}
              >
                {copiedId === item.id ? 'Скопировано!' : 'Ссылка'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
