import styles from './AccountDocRow.module.css';

export type AccountDocRowProps = {
  title: string;
  /** Если задан — рендерится ссылка; иначе кнопка (мок). */
  href?: string;
  onClick?: () => void;
};

const DOC_ICON = '/icons/doc.svg';

export function AccountDocRow({ title, href, onClick }: AccountDocRowProps) {
  const content = (
    <>
      <img src={DOC_ICON} alt="" width={18} height={18} className={styles.docIcon} aria-hidden />
      <span className={styles.docTitle}>{title}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={styles.doc}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={styles.doc} onClick={onClick}>
      {content}
    </button>
  );
}
