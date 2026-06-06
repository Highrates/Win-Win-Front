'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { adminDetailErrorFromBackend } from '@/lib/adminQuery';
import type { DesignerProjectDetailApi, DesignerProjectLineApi } from '@/lib/designerProjects/apiTypes';
import catalogStyles from '../../catalog/catalogAdmin.module.css';
import clientsStyles from '../../clients/clients.module.css';
import styles from '../designer-projects.module.css';

type AdminDetail = DesignerProjectDetailApi & { userId: string; userEmail: string | null };

function formatRub(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return '—';
  return `~${Math.round(n).toLocaleString('ru-RU')}\u00A0₽`;
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function DesignerProjectAdminDetailClient({
  projectId,
  t,
}: {
  projectId: string;
  t: {
    detailBack: string;
    detailUser: string;
    detailAddress: string;
    detailUpdated: string;
    detailTotal: string;
    linesTitle: string;
    lineProduct: string;
    lineCategory: string;
    lineQty: string;
    lineUnit: string;
    lineVariant: string;
    lineTotal: string;
    loading: string;
    errLoad: string;
  };
}) {
  const [detail, setDetail] = useState<AdminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setErr(null);
      try {
        const j = await adminBackendJson<AdminDetail>(
          `designer-projects/admin/${encodeURIComponent(projectId)}`,
        );
        if (!cancelled) setDetail(j);
      } catch (e) {
        if (!cancelled) {
          setErr(adminDetailErrorFromBackend(e, { fallback: t.errLoad }));
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, t.errLoad]);

  const lineTitle = (line: DesignerProjectLineApi) => {
    const snap = line.snapshot as { productName?: unknown };
    if (typeof snap.productName === 'string' && snap.productName.trim()) return snap.productName.trim();
    return line.productSlug?.trim() || line.productId;
  };

  const userLabel = detail?.userEmail?.trim() || detail?.userId;

  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin/designer-projects" className={catalogStyles.backLink}>
          {t.detailBack}
        </Link>
      </p>

      {loading ? <p className={catalogStyles.muted}>{t.loading}</p> : null}
      {err ? (
        <p className={catalogStyles.error} role="alert">
          {err}
        </p>
      ) : null}

      {!loading && detail ? (
        <>
          <h1 className={catalogStyles.title}>{detail.name.trim() || '—'}</h1>

          <dl className={clientsStyles.detailList}>
            <div>
              <dt>{t.detailUser}</dt>
              <dd>
                {userLabel ? (
                  <Link
                    href={`/admin/clients/${encodeURIComponent(detail.userId)}`}
                    className={catalogStyles.backLink}
                  >
                    {userLabel}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>{t.detailAddress}</dt>
              <dd>{detail.address?.trim() || '—'}</dd>
            </div>
            <div>
              <dt>{t.detailUpdated}</dt>
              <dd>{formatWhen(detail.updatedAt)}</dd>
            </div>
            <div>
              <dt>{t.detailTotal}</dt>
              <dd>{formatRub(detail.totalRub)}</dd>
            </div>
          </dl>

          <h2 className={catalogStyles.groupHeading}>{t.linesTitle}</h2>
          {detail.lines.length === 0 ? (
            <p className={catalogStyles.muted}>—</p>
          ) : (
            <div className={catalogStyles.tableWrap}>
              <table className={catalogStyles.table}>
                <thead>
                  <tr>
                    <th>{t.lineProduct}</th>
                    <th>{t.lineCategory}</th>
                    <th>{t.lineQty}</th>
                    <th>{t.lineUnit}</th>
                    <th>{t.lineVariant}</th>
                    <th>{t.lineTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lines.map((l) => (
                    <tr key={l.id}>
                      <td>{lineTitle(l)}</td>
                      <td>{l.categoryLabel ?? '—'}</td>
                      <td>{String(l.quantity)}</td>
                      <td>{l.unit}</td>
                      <td className={styles.mono}>{l.productVariantId ?? '—'}</td>
                      <td>{formatRub(l.lineTotalRub)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}
