import Link from 'next/link';
import type { AccountDocFileType } from '@/lib/account/docFileType';
import { AccountDocFileIcon } from './AccountDocFileIcon';
import styles from './AccountDocRow.module.css';

export type AccountDocRowProps = {
  title: string;
  /** Тип файла: иконка и бейдж (PDF / XLSX / DOCX…). */
  fileType?: AccountDocFileType;
  /** Вторая строка серым (источник документа). */
  meta?: string;
  /** Ссылка из второй строки (заказ / заявка / чат). */
  metaHref?: string;
  /** Доп. текст второй строки после источника (дата и т.п.), без ссылки. */
  metaSuffix?: string;
  /** Если задан — ссылка на файл; иначе кнопка. */
  href?: string;
  /**
   * Что произойдёт по клику (иконка и поведение ссылки):
   * `open` — просмотр во вкладке (PDF), `download` — скачивание без пустой вкладки, `external` — другой сайт.
   */
  action?: AccountDocAction;
  onClick?: () => void;
};

export type AccountDocAction = 'open' | 'download' | 'external';

const ACTION_ICON_PATHS: Record<AccountDocAction, string> = {
  open: 'M1.667 10S4.583 4.167 10 4.167 18.333 10 18.333 10 15.417 15.833 10 15.833 1.667 10 1.667 10ZM10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  download: 'M10 3.333v9.167M6.25 8.75 10 12.5l3.75-3.75M3.333 15.833h13.334',
  external:
    'M11.667 3.333h5v5M16.667 3.333 9.167 10.833M14.167 11.667v3.75c0 .69-.56 1.25-1.25 1.25H4.583c-.69 0-1.25-.56-1.25-1.25V7.083c0-.69.56-1.25 1.25-1.25h3.75',
};

const ACTION_HINT: Record<AccountDocAction, string> = {
  open: 'откроется в новой вкладке',
  download: 'скачать',
  external: 'откроется на внешнем сайте',
};

function TrailingIcon({ action }: { action: AccountDocAction }) {
  return (
    <svg className={styles.docTrailing} viewBox="0 0 20 20" fill="none" aria-hidden focusable="false">
      <path
        d={ACTION_ICON_PATHS[action]}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AccountDocRow({
  title,
  fileType,
  meta,
  metaHref,
  metaSuffix,
  href,
  action = 'download',
  onClick,
}: AccountDocRowProps) {
  const titleNode = href ? (
    <a
      href={href}
      className={`${styles.docTitle} ${styles.docTitleLink}`}
      {...(action === 'download' ? { download: true } : { target: '_blank', rel: 'noopener noreferrer' })}
      aria-label={`${title} — ${ACTION_HINT[action]}`}
    >
      {title}
    </a>
  ) : (
    <button type="button" className={`${styles.docTitle} ${styles.docTitleLink}`} onClick={onClick}>
      {title}
    </button>
  );

  const metaNode = meta ? (
    metaHref ? (
      <Link href={metaHref} className={`${styles.docMeta} ${styles.docMetaLink}`}>
        {meta}
      </Link>
    ) : (
      <span className={styles.docMeta}>{meta}</span>
    )
  ) : null;

  return (
    <div className={styles.doc}>
      <AccountDocFileIcon kind={fileType?.kind ?? 'other'} />
      <span className={styles.docText}>
        {titleNode}
        {metaNode || metaSuffix ? (
          <span className={styles.docMetaRow}>
            {metaNode}
            {metaNode && metaSuffix ? <span className={styles.docMeta} aria-hidden>·</span> : null}
            {metaSuffix ? <span className={styles.docMeta}>{metaSuffix}</span> : null}
          </span>
        ) : null}
      </span>
      {fileType?.badge ? <span className={styles.docBadge}>{fileType.badge}</span> : null}
      {href ? <TrailingIcon action={action} /> : null}
    </div>
  );
}
