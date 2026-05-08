'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { DesignerProjectDetailApi, DesignerProjectLineApi } from '@/lib/designerProjects/apiTypes';
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
        const res = await fetch(`/api/admin/backend/designer-projects/admin/${encodeURIComponent(projectId)}`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(j.message || `HTTP ${res.status}`);
        }
        const j = (await res.json()) as AdminDetail;
        if (!cancelled) setDetail(j);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : t.errLoad);
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

  return (
    <main className={styles.panel}>
      <p>
        <Link href="/admin/designer-projects" className={styles.rowLink}>
          {t.detailBack}
        </Link>
      </p>

      {loading ? <p>{t.loading}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}

      {!loading && detail ? (
        <>
          <h1 style={{ marginTop: 16 }}>{detail.name.trim() || '—'}</h1>
          <div className={styles.metaGrid}>
            <span className={styles.metaLabel}>{t.detailUser}</span>
            <span>{detail.userEmail?.trim() || <span className={styles.mono}>{detail.userId}</span>}</span>
            <span className={styles.metaLabel}>{t.detailAddress}</span>
            <span>{detail.address?.trim() || '—'}</span>
            <span className={styles.metaLabel}>{t.detailUpdated}</span>
            <span>{formatWhen(detail.updatedAt)}</span>
            <span className={styles.metaLabel}>{t.detailTotal}</span>
            <span>{formatRub(detail.totalRub)}</span>
          </div>

          <h2 className={styles.subTitle}>{t.linesTitle}</h2>
          {detail.lines.length === 0 ? (
            <p>—</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
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
