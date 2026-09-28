export type AccountDocFileKind = 'pdf' | 'sheet' | 'text-doc' | 'plain' | 'archive' | 'other';

export type AccountDocFileType = {
  kind: AccountDocFileKind;
  /** Короткий бейдж (PDF, XLSX, DOCX…); null — тип неизвестен. */
  badge: string | null;
};

const EXT_KIND: Record<string, AccountDocFileKind> = {
  pdf: 'pdf',
  xls: 'sheet',
  xlsx: 'sheet',
  xlsm: 'sheet',
  csv: 'sheet',
  ods: 'sheet',
  numbers: 'sheet',
  doc: 'text-doc',
  docx: 'text-doc',
  odt: 'text-doc',
  rtf: 'text-doc',
  pages: 'text-doc',
  txt: 'plain',
  md: 'plain',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
};

const MIME_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
};

export function accountDocFileType(doc: { ext: string | null; mimeType: string | null }): AccountDocFileType {
  const mime = doc.mimeType?.split(';')[0].trim().toLowerCase() ?? '';
  const ext = doc.ext?.toLowerCase() || MIME_EXT[mime] || null;
  if (!ext) return { kind: 'other', badge: null };
  return {
    kind: EXT_KIND[ext] ?? 'other',
    badge: ext.length <= 5 ? ext.toUpperCase() : null,
  };
}
