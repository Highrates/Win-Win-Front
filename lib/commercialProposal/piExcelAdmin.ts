import {
  AdminBackendRequestError,
  adminBackendFetch,
  adminBackendPath,
  readAdminApiError,
} from '@/lib/adminBackendFetch';

function filenameFromContentDisposition(cd: string | null, fallback: string): string {
  if (!cd) return fallback;
  const m =
    /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(cd);
  const raw = decodeURIComponent((m?.[1] || m?.[2] || m?.[3] || '').trim());
  return raw || fallback;
}

/** Download PI Excel from Nest via admin BFF. */
export async function downloadPiExcel(apiPath: string, fallbackName: string): Promise<void> {
  const res = await adminBackendFetch(apiPath);
  if (!res.ok) {
    throw new AdminBackendRequestError(await readAdminApiError(res), res.status);
  }
  const blob = await res.blob();
  const name = filenameFromContentDisposition(
    res.headers.get('content-disposition'),
    fallbackName,
  );
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type PiExcelFieldChange = {
  field: string;
  before: string | number | null;
  after: string | number | null;
};

export type PiExcelLineChange = {
  lineId: string;
  label: string;
  excelRow: number;
  fields: PiExcelFieldChange[];
};

export type PiExcelImportResult = {
  draft: unknown;
  dryRun?: boolean;
  /** merge-only onto existing draft, or draft was created then merged */
  mode?: 'merged' | 'created';
  draftCreated?: boolean;
  /** ISO timestamp of draft at preview time — send back on apply for optimistic concurrency */
  draftUpdatedAt?: string | null;
  /** Parsed from Excel header F6 (logged server-side; informational) */
  invoiceNoHint?: string | null;
  updatedCount: number;
  changedLineCount?: number;
  unchangedCount: number;
  unmatchedCount?: number;
  unmatched?: string[];
  emptyMatchKeyRows?: number[];
  changes?: PiExcelLineChange[];
};

/**
 * @deprecated Prefers dry-run diff modal on /kp; create/merge confirm before file pick was removed.
 * Kept for rare callers / tests.
 */
export function confirmPiExcelImport(opts: {
  draftExists: boolean;
  mergeMessage: string;
  createMessage: string;
}): boolean {
  return window.confirm(opts.draftExists ? opts.mergeMessage : opts.createMessage);
}

/** Append query params for import preview / optimistic concurrency. Exported for unit tests. */
export function withImportExcelQuery(
  apiPath: string,
  opts?: { dryRun?: boolean; expectedUpdatedAt?: string | null },
): string {
  const params = new URLSearchParams();
  if (opts?.dryRun) params.set('dryRun', '1');
  if (opts?.expectedUpdatedAt) params.set('expectedUpdatedAt', opts.expectedUpdatedAt);
  const q = params.toString();
  if (!q) return apiPath;
  const sep = apiPath.includes('?') ? '&' : '?';
  return `${apiPath}${sep}${q}`;
}

/** @deprecated use withImportExcelQuery */
export function withDryRunQuery(apiPath: string, dryRun: boolean): string {
  return withImportExcelQuery(apiPath, { dryRun });
}

/** Upload filled PI Excel; merges into KP draft. Pass dryRun for preview without putDraft. */
export async function importPiExcel(
  apiPath: string,
  file: File,
  opts?: { dryRun?: boolean; expectedUpdatedAt?: string | null },
): Promise<PiExcelImportResult> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(adminBackendPath(withImportExcelQuery(apiPath, opts)), {
    method: 'POST',
    credentials: 'same-origin',
    body: fd,
  });
  if (!res.ok) {
    throw new AdminBackendRequestError(await readAdminApiError(res), res.status);
  }
  return (await res.json()) as PiExcelImportResult;
}

/** Client-side text report for soft unmatched + empty match-key rows. */
export function downloadPiExcelImportReport(
  result: Pick<PiExcelImportResult, 'unmatched' | 'emptyMatchKeyRows' | 'updatedCount' | 'unchangedCount'>,
  filename = 'pi-excel-import-report.txt',
): void {
  const lines: string[] = [
    `Updated (matched): ${result.updatedCount}`,
    `Unchanged draft lines: ${result.unchangedCount}`,
    `Unmatched Excel rows: ${result.unmatched?.length ?? 0}`,
    `Empty match-key (col T) rows: ${result.emptyMatchKeyRows?.length ?? 0}`,
    '',
  ];
  if (result.emptyMatchKeyRows?.length) {
    lines.push('Empty col T (Excel rows):');
    for (const r of result.emptyMatchKeyRows) lines.push(`  - row ${r}`);
    lines.push('');
  }
  if (result.unmatched?.length) {
    lines.push('Unmatched:');
    for (const u of result.unmatched) lines.push(`  - ${u}`);
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
