'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import catalogStyles from '../../../../catalog/catalogAdmin.module.css';
import clientsStyles from '../../../clients.module.css';
import {
  type ApiCase,
  coverUrlsFromUnknown,
  parseApiCaseRow,
  stringArrayFromUnknown,
} from '@/lib/account/caseApiSchema';

function formatRuDate(iso: string | undefined) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export function AdminCaseDetailClient({
  clientId,
  caseId,
}: {
  clientId: string;
  caseId: string;
}) {
  const [row, setRow] = useState<ApiCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productLabels, setProductLabels] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/backend/cases/admin/${encodeURIComponent(caseId)}`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled) setError(`Ошибка ${res.status}`);
          return;
        }
        const dto = parseApiCaseRow(await res.json());
        if (cancelled) return;
        if (!dto) {
          setRow(null);
          setError('Некорректный ответ сервера');
          return;
        }
        if (dto.userId !== clientId) {
          setError('Кейс принадлежит другому клиенту');
          setRow(null);
          return;
        }
        setRow(dto);
        const pids = stringArrayFromUnknown(dto.productIds, 80);
        if (pids.length) {
          const pr = await fetch('/api/public/catalog/products/resolve-ids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: pids }),
            cache: 'no-store',
          });
          if (pr.ok && !cancelled) {
            const j = (await pr.json()) as { items?: { id: string; name: string; slug: string }[] };
            const items = Array.isArray(j.items) ? j.items : [];
            setProductLabels(pids.map((id) => items.find((x) => x.id === id) ?? { id, name: 'Товар', slug: '' }));
          }
        } else if (!cancelled) setProductLabels([]);
      } catch {
        if (!cancelled) setError('Сеть или сервер недоступны');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, caseId]);

  const covers = useMemo(() => coverUrlsFromUnknown(row?.coverImageUrls, 4), [row?.coverImageUrls]);
  const rooms = useMemo(() => stringArrayFromUnknown(row?.roomTypes, 20), [row?.roomTypes]);

  return (
    <div className={clientsStyles.tabPanel}>
      <div style={{ marginBottom: 20 }}>
        <Link href={`/admin/clients/${encodeURIComponent(clientId)}`} className={catalogStyles.backLink}>
          ← К списку кейсов клиента
        </Link>
      </div>

      {loading ? <p className={catalogStyles.muted}>Загрузка…</p> : null}
      {error ? (
        <p className={clientsStyles.error} role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && row ? (
        <>
          <h1 style={{ marginTop: 0, fontSize: '1.35rem', fontWeight: 600 }}>{row.title}</h1>
          <p className={catalogStyles.muted} style={{ marginTop: 4 }}>
            Создан: {formatRuDate(row.createdAt)} · Обновлён: {formatRuDate(row.updatedAt)}
          </p>

          <dl className={clientsStyles.detailList} style={{ marginTop: 24 }}>
            <div>
              <dt>Короткое описание</dt>
              <dd>{row.shortDescription?.trim() ? row.shortDescription : '—'}</dd>
            </div>
            <div>
              <dt>Локация</dt>
              <dd>{row.location?.trim() ? row.location : '—'}</dd>
            </div>
            <div>
              <dt>Год</dt>
              <dd>{row.year != null ? String(row.year) : '—'}</dd>
            </div>
            <div>
              <dt>Бюджет</dt>
              <dd>{row.budget?.trim() ? row.budget : '—'}</dd>
            </div>
            <div>
              <dt>Сетка обложки</dt>
              <dd>{row.coverLayout?.trim() ? row.coverLayout : '—'}</dd>
            </div>
            <div>
              <dt>Помещения</dt>
              <dd>{rooms.length ? rooms.join(', ') : '—'}</dd>
            </div>
            <div>
              <dt>Товары в кейсе</dt>
              <dd>
                {productLabels.length ? (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                    {productLabels.map((p) => (
                      <li key={p.id}>
                        {p.slug ? (
                          <a href={`/product/${encodeURIComponent(p.slug)}`} target="_blank" rel="noreferrer">
                            {p.name}
                          </a>
                        ) : (
                          p.name
                        )}{' '}
                        <span className={catalogStyles.muted}>({p.id})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>

          {covers.length ? (
            <section style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12 }}>Обложки</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {covers.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt=""
                      style={{ width: 200, maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                    />
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {row.descriptionHtml?.trim() ? (
            <section style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12 }}>Описание</h2>
              {/* HTML санитизируется на бэкенде при сохранении кейса */}
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: row.descriptionHtml }} />
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
