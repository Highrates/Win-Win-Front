import type { AccountDocFileKind } from '@/lib/account/docFileType';
import styles from './AccountDocRow.module.css';

const KIND_CLASS: Record<AccountDocFileKind, string | undefined> = {
  pdf: styles.iconPdf,
  'text-doc': styles.iconTextDoc,
  sheet: undefined,
  plain: undefined,
  archive: styles.iconMuted,
  other: styles.iconMuted,
};

function Glyph({ kind }: { kind: AccountDocFileKind }) {
  switch (kind) {
    case 'sheet':
      return (
        <>
          <rect x="4.33" y="8" width="6.67" height="4.67" rx="0.5" />
          <path d="M4.33 10.33H11M7.67 8V12.67" />
        </>
      );
    case 'text-doc':
      return <path d="M4.67 8.67H10M4.67 10.67H10M4.67 12.67H7.33" />;
    case 'pdf':
    case 'plain':
      return <path d="M4.67 8.67H8.67M4.67 11.33H7.33" />;
    case 'archive':
      return <path d="M6 5.33V6.33M6 7.67V8.67M6 10V11M5.33 12.33H6.67" />;
    case 'other':
      return null;
  }
}

/** Иконка документа по типу: общий контур как у doc.svg, глиф и акцент — по виду файла. */
export function AccountDocFileIcon({ kind }: { kind: AccountDocFileKind }) {
  return (
    <svg
      className={`${styles.docIcon} ${KIND_CLASS[kind] ?? ''}`.trim()}
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.96"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14.67 6.67V10C14.67 13.33 13.33 14.67 10 14.67H6C2.67 14.67 1.33 13.33 1.33 10V6C1.33 2.67 2.67 1.33 6 1.33H9.33" />
      <path d="M14.67 6.67H12C10 6.67 9.33 6 9.33 4V1.33L14.67 6.67Z" />
      <Glyph kind={kind} />
    </svg>
  );
}
