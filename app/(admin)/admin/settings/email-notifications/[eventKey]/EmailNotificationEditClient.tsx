'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminModal } from '@/components/admin/AdminModal/AdminModal';
import { AdminTabs } from '@/components/AdminTabs/AdminTabs';
import { AdminSelect, AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { AdminBackendRequestError, adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import { useUnsavedChangesGuard } from '@/lib/adminConfirm/useUnsavedChangesGuard';
import catalogStyles from '../../../catalog/catalogAdmin.module.css';
import local from '../emailNotifications.module.css';
import {
  AUDIENCE_LABEL,
  EMAIL_NOTIFICATIONS_HREF,
  emailNotificationApi,
  formatDateTime,
  lastErrorSummary,
  recipientsSummary,
  revisionChanges,
  TEMPLATE_FIELDS,
  templateFieldLabel,
  type EmailNotificationDetail,
  type EmailNotificationRevision,
  type EmailPreview,
  type EmailTemplateFields,
  type EmailTestSendResult,
} from '../emailNotificationsShared';
import { EMAIL_NOTIFICATION_REVISIONS_KEEP as REVISIONS_SHOWN } from '@win-win/admin-sections';
import { diffLines } from '@/lib/textDiff';

type VersionSnapshot = EmailTemplateFields & { enabled: boolean };

/** Версия из истории и то, чем её заменили (следующая версия или текущая сохранённая). */
type RevisionCompare = { before: EmailNotificationRevision; after: VersionSnapshot; afterLabel: string };

type FieldName = keyof EmailTemplateFields;
type FieldEl = HTMLInputElement | HTMLTextAreaElement;
type SampleVariant = 'full' | 'sparse';

const SAMPLE_LABEL: Record<SampleVariant, string> = {
  full: 'все поля заполнены',
  sparse: 'без необязательных полей',
};

function errorText(e: unknown, fallback: string): string {
  return e instanceof AdminBackendRequestError ? e.message : fallback;
}

export function EmailNotificationEditClient({ eventKey }: { eventKey: string }) {
  const { confirm } = useAdminConfirm();
  const [detail, setDetail] = useState<EmailNotificationDetail | null>(null);
  const [revisions, setRevisions] = useState<EmailNotificationRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fields, setFields] = useState<EmailTemplateFields>({ subject: '', title: '', body: '' });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<null | 'save' | 'preview' | 'test' | 'toggle'>(null);
  const [sampleVariant, setSampleVariant] = useState<SampleVariant>('full');
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [previewTab, setPreviewTab] = useState<'html' | 'text'>('html');
  const [compare, setCompare] = useState<RevisionCompare | null>(null);
  const fieldEls = useRef<Partial<Record<FieldName, FieldEl>>>({});
  const lastFocused = useRef<FieldName>('body');

  const applyDetail = useCallback((d: EmailNotificationDetail) => {
    setDetail(d);
    setFields({ subject: d.subject, title: d.title, body: d.body });
    setDirty(false);
  }, []);

  const loadRevisions = useCallback(async () => {
    const rev = await adminBackendJson<EmailNotificationRevision[]>(emailNotificationApi(eventKey, '/revisions')).catch(
      () => [] as EmailNotificationRevision[],
    );
    setRevisions(Array.isArray(rev) ? rev : []);
  }, [eventKey]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      applyDetail(await adminBackendJson<EmailNotificationDetail>(emailNotificationApi(eventKey)));
      await loadRevisions();
    } catch (e) {
      setLoadError(errorText(e, 'Не удалось загрузить уведомление'));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [eventKey, applyDetail, loadRevisions]);

  useEffect(() => {
    void load();
  }, [load]);

  useUnsavedChangesGuard(dirty);

  function setField(name: FieldName, value: string) {
    setFields((f) => ({ ...f, [name]: value }));
    setDirty(true);
    setNotice(null);
  }

  function fieldFocusProps(name: FieldName) {
    return {
      onFocus: (e: React.FocusEvent<FieldEl>) => {
        fieldEls.current[name] = e.currentTarget;
        lastFocused.current = name;
      },
    };
  }

  /** Вставка в позицию курсора последнего поля, где был фокус (или в конец). */
  function insertAt(name: FieldName, open: string, close = '') {
    const el = fieldEls.current[name];
    const value = fields[name];
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    const selected = value.slice(start, end);
    setField(name, value.slice(0, start) + open + selected + close + value.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = start + open.length + selected.length;
      el.setSelectionRange(caret, caret);
    });
  }

  function validateFilled(): boolean {
    if (fields.subject.trim() && fields.title.trim() && fields.body.trim()) return true;
    setError('Заполните тему, заголовок и текст письма');
    return false;
  }

  async function save() {
    if (!detail || busy || !validateFilled()) return;
    setBusy('save');
    setError(null);
    setNotice(null);
    try {
      const d = await adminBackendJson<EmailNotificationDetail>(emailNotificationApi(eventKey), {
        method: 'PUT',
        body: JSON.stringify(fields),
      });
      applyDetail(d);
      await loadRevisions();
      setNotice('Сохранено');
    } catch (e) {
      setError(errorText(e, 'Не удалось сохранить'));
    } finally {
      setBusy(null);
    }
  }

  async function openPreview() {
    if (busy || !validateFilled()) return;
    setBusy('preview');
    setError(null);
    try {
      const data = await adminBackendJson<EmailPreview>(emailNotificationApi(eventKey, '/preview'), {
        method: 'POST',
        body: JSON.stringify({ ...fields, sampleVariant }),
      });
      setPreviewTab('html');
      setPreview(data);
    } catch (e) {
      setError(errorText(e, 'Не удалось собрать предпросмотр'));
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    if (busy || !validateFilled()) return;
    const ok = await confirm({
      title: 'Отправить тестовое письмо?',
      message: `Письмо с пометкой [тест] уйдёт на ваш email. Текст — из редактора (даже несохранённый), данные — демо (${SAMPLE_LABEL[sampleVariant]}). Отправится, даже если уведомление выключено.`,
      confirmLabel: 'Отправить',
      confirmVariant: 'accent',
    });
    if (!ok) return;
    setBusy('test');
    setError(null);
    setNotice(null);
    try {
      const res = await adminBackendJson<EmailTestSendResult>(emailNotificationApi(eventKey, '/test-send'), {
        method: 'POST',
        body: JSON.stringify({ ...fields, sampleVariant }),
      });
      setNotice(`Тестовое письмо отправлено на ${res.to}`);
    } catch (e) {
      setError(errorText(e, 'Не удалось отправить тестовое письмо'));
    } finally {
      setBusy(null);
    }
  }

  async function resetToDefaults() {
    if (!detail) return;
    const ok = await confirm({
      title: 'Вернуть текст по умолчанию?',
      message: 'Тема, заголовок и сообщение заменятся исходными. Изменения применятся после сохранения.',
      confirmLabel: 'Вернуть',
      confirmVariant: 'accent',
    });
    if (!ok) return;
    setFields({ subject: detail.defaultSubject, title: detail.defaultTitle, body: detail.defaultBody });
    setDirty(true);
    setNotice(null);
  }

  function discardChanges() {
    if (detail) applyDetail(detail);
    setError(null);
    setNotice(null);
  }

  /** Как в списке — сразу, без «Сохранить»; несохранённый текст в редакторе не трогаем. */
  async function onToggleEnabled(next: boolean) {
    if (!detail || busy) return;
    if (!next) {
      const ok = await confirm({
        title: 'Выключить письмо?',
        message: `Письмо перестанет отправляться сразу. Письмо с текстом по умолчанию тоже не уйдёт.${
          dirty ? ' Несохранённые правки текста останутся в редакторе.' : ''
        }`,
        confirmLabel: 'Выключить',
      });
      if (!ok) return;
    }
    setBusy('toggle');
    setError(null);
    setNotice(null);
    try {
      const d = await adminBackendJson<EmailNotificationDetail>(emailNotificationApi(eventKey), {
        method: 'PUT',
        body: JSON.stringify({ enabled: next }),
      });
      setDetail(d);
      await loadRevisions();
      setNotice(d.enabled ? 'Письмо включено' : 'Письмо выключено');
    } catch (e) {
      setError(errorText(e, 'Не удалось изменить статус'));
    } finally {
      setBusy(null);
    }
  }

  function restoreRevision(r: EmailNotificationRevision) {
    setFields({ subject: r.subject, title: r.title, body: r.body });
    setDirty(true);
    setError(null);
    setNotice(`Версия от ${formatDateTime(r.createdAt)} загружена в редактор — сохраните, чтобы применить`);
  }

  const backLink = (
    <p className={catalogStyles.backRow}>
      <Link href={EMAIL_NOTIFICATIONS_HREF} className={catalogStyles.backLink}>
        ← Email-уведомления
      </Link>
    </p>
  );

  if (loading) {
    return (
      <>
        {backLink}
        <p className={catalogStyles.muted}>Загрузка…</p>
      </>
    );
  }

  if (!detail) {
    return (
      <>
        {backLink}
        <p className={catalogStyles.error} role="alert">
          {loadError ?? 'Уведомление не найдено'}{' '}
          <AdminCompactBtn type="button" variant="outline" onClick={() => void load()}>
            Повторить
          </AdminCompactBtn>
        </p>
      </>
    );
  }

  const disabled = busy !== null;
  const enabled = detail.enabled;
  const lastError = lastErrorSummary(detail);
  const recipients = detail.recipients ? recipientsSummary(detail.recipients) : null;
  const saved: VersionSnapshot = { subject: detail.subject, title: detail.title, body: detail.body, enabled };
  const replacementOf = (index: number): { after: VersionSnapshot; afterLabel: string } => {
    const newer = revisions[index - 1];
    return newer
      ? { after: newer, afterLabel: `версия от ${formatDateTime(newer.createdAt)}` }
      : { after: saved, afterLabel: 'текущая сохранённая версия' };
  };

  return (
    <div className={local.page}>
      {backLink}
      <h1 className={catalogStyles.title}>{detail.label}</h1>
      <p className={catalogStyles.lead}>{detail.description}</p>

      <div className={local.meta}>
        <span className={`${catalogStyles.badge} ${enabled ? catalogStyles.badgeOn : catalogStyles.badgeOff}`}>
          {enabled ? 'Включено' : 'Выключено'}
        </span>
        <span className={`${catalogStyles.badge} ${catalogStyles.badgeOff}`}>{AUDIENCE_LABEL[detail.audience]}</span>
        <span className={catalogStyles.mutedInline}>
          {detail.isCustomized ? 'Текст изменён' : 'Текст по умолчанию'}
          {detail.lastEditedAt
            ? ` · изменил ${detail.lastEditedByEmail ?? '—'} ${formatDateTime(detail.lastEditedAt)}`
            : ''}
        </span>
        {lastError ? (
          <span className={catalogStyles.mutedInline} title={lastError.title}>
            {lastError.label}
          </span>
        ) : null}
        {recipients ? (
          <span
            className={`${catalogStyles.mutedInline} ${recipients.empty ? local.recipientsEmpty : ''}`}
            title={recipients.title}
          >
            {recipients.label}
          </span>
        ) : null}
      </div>

      <div className={local.toolbar}>
        <span className={catalogStyles.mutedInline}>{dirty ? 'Есть несохранённые изменения' : ''}</span>
        <div className={local.toolbarActions}>
          <AdminCompactBtn type="button" variant="outline" disabled={disabled || !dirty} onClick={discardChanges}>
            Отменить правки
          </AdminCompactBtn>
          <AdminCompactBtn type="button" variant="outline" disabled={disabled} onClick={() => void resetToDefaults()}>
            По умолчанию
          </AdminCompactBtn>
          <AdminCompactBtn type="button" variant="outline" disabled={disabled} onClick={() => void sendTest()}>
            {busy === 'test' ? 'Отправка…' : 'Тест мне на почту'}
          </AdminCompactBtn>
          <AdminCompactBtn type="button" variant="outline" disabled={disabled} onClick={() => void openPreview()}>
            {busy === 'preview' ? 'Сборка…' : 'Предпросмотр'}
          </AdminCompactBtn>
          <AdminCompactBtn type="button" variant="accent" disabled={disabled || !dirty} onClick={() => void save()}>
            {busy === 'save' ? 'Сохранение…' : 'Сохранить'}
          </AdminCompactBtn>
        </div>
      </div>

      {error ? (
        <p className={catalogStyles.error} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className={catalogStyles.muted} style={{ margin: '0 0 12px' }} role="status">
          {notice}
        </p>
      ) : null}

      <div className={local.layout}>
        <section className={local.panel}>
          <div className={catalogStyles.labelCheckboxRow}>
            <AccountCheckbox
              id="email-notification-enabled"
              className={catalogStyles.adminCheckboxForm}
              checked={enabled}
              disabled={disabled}
              onChange={(e) => void onToggleEnabled(e.target.checked)}
            />
            <label htmlFor="email-notification-enabled">Отправлять это письмо (применяется сразу)</label>
          </div>

          <AdminTextField
            label="Тема письма"
            value={fields.subject}
            maxLength={300}
            disabled={disabled}
            onChange={(e) => setField('subject', e.target.value)}
            {...fieldFocusProps('subject')}
          />
          <AdminTextField
            label="Заголовок в письме"
            value={fields.title}
            maxLength={300}
            disabled={disabled}
            onChange={(e) => setField('title', e.target.value)}
            {...fieldFocusProps('title')}
          />
          <AdminTextArea
            label="Сообщение"
            className={local.bodyField}
            value={fields.body}
            rows={16}
            disabled={disabled}
            onChange={(e) => setField('body', e.target.value)}
            {...fieldFocusProps('body')}
          />
          <p className={local.hint}>
            Абзацы разделяйте пустой строкой. <code>**текст**</code> — жирный, строки с <code>- </code> — список,
            ссылки становятся кликабельными. Разметка действует только на ваш текст: значения переменных (сообщение
            клиента, имена) вставляются как есть. Блоки из справочника (<code>{'{{cta.button}}'}</code> и другие)
            ставьте отдельным абзацем; кнопка обязательна. Условие <code>{'{{#if …}}текст{{/if}}'}</code>
            показывает текст, только если значение не пустое.
          </p>

          <AdminSelect
            label="Демо-данные для предпросмотра и теста"
            className={local.sampleSelect}
            value={sampleVariant}
            disabled={disabled}
            onChange={(e) => setSampleVariant(e.target.value === 'sparse' ? 'sparse' : 'full')}
          >
            <option value="full">Все поля заполнены</option>
            <option value="sparse">Без необязательных полей</option>
          </AdminSelect>
        </section>

        <aside className={`${local.panel} ${local.aside}`}>
          <h2 className={`${catalogStyles.groupHeading} ${local.panelHeading}`}>Блоки письма</h2>
          <p className={local.hint}>Вставляются в сообщение.</p>
          <ul className={local.varList}>
            {detail.snippets.map((s) => (
              <li key={s.key} className={local.varRow}>
                <AdminCompactBtn
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  title={`Вставить {{${s.key}}}`}
                  onClick={() => insertAt('body', `{{${s.key}}}`)}
                >
                  <code>{`{{${s.key}}}`}</code>
                </AdminCompactBtn>
                <span className={local.varLabel}>{s.label}</span>
              </li>
            ))}
          </ul>

          <h2 className={`${catalogStyles.groupHeading} ${local.panelHeading}`}>Переменные</h2>
          <p className={local.hint}>
            Вставляются туда, где стоит курсор. «#if» оборачивает выделенный текст условием.
          </p>
          <ul className={local.varList}>
            {detail.variables.map((v) => (
              <li key={v.key} className={local.varRow}>
                <div className={local.varButtons}>
                  <AdminCompactBtn
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    title={`Вставить {{${v.key}}}`}
                    onClick={() => insertAt(lastFocused.current, `{{${v.key}}}`)}
                  >
                    <code>{`{{${v.key}}}`}</code>
                  </AdminCompactBtn>
                  {v.optional ? (
                    <AdminCompactBtn
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      title={`Обернуть в {{#if ${v.key}}}…{{/if}}`}
                      onClick={() => insertAt(lastFocused.current, `{{#if ${v.key}}}`, '{{/if}}')}
                    >
                      #if
                    </AdminCompactBtn>
                  ) : null}
                </div>
                <span className={local.varLabel}>{v.label}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {revisions.length > 0 ? (
        <section className={local.history}>
          <h2 className={catalogStyles.groupHeading}>История правок</h2>
          <p className={local.hint} style={{ marginBottom: 12 }}>
            Версии, которые были до каждого сохранения (хранятся последние {REVISIONS_SHOWN}). «Сравнить» показывает,
            что поменялось при замене. «Вернуть» загружает текст версии в редактор — чтобы применить, сохраните.
            Выключатель отправки при этом не меняется.
          </p>
          <div className={catalogStyles.tableWrap}>
            <table className={catalogStyles.table}>
              <thead>
                <tr>
                  <th>Заменена</th>
                  <th>Кем</th>
                  <th>Что изменилось</th>
                  <th>Тема версии</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {revisions.map((r, index) => {
                  const replacement = replacementOf(index);
                  const changes = revisionChanges(r, replacement.after);
                  return (
                    <tr key={r.id}>
                      <td className={catalogStyles.mutedInline}>{formatDateTime(r.createdAt)}</td>
                      <td className={catalogStyles.mutedInline}>{r.actorEmail ?? '—'}</td>
                      <td>{changes.length ? changes.join(', ') : '—'}</td>
                      <td>{r.subject}</td>
                      <td className={catalogStyles.tableCellActions}>
                        <div className={local.toolbarActions}>
                          <AdminCompactBtn
                            type="button"
                            variant="outline"
                            disabled={disabled}
                            onClick={() => setCompare({ before: r, ...replacement })}
                          >
                            Сравнить
                          </AdminCompactBtn>
                          <AdminCompactBtn type="button" variant="outline" disabled={disabled} onClick={() => restoreRevision(r)}>
                            Вернуть
                          </AdminCompactBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <AdminModal
        open={compare !== null}
        title="Сравнение версий"
        wide
        onClose={() => setCompare(null)}
        footer={
          <AdminCompactBtn type="button" variant="accent" onClick={() => setCompare(null)}>
            Закрыть
          </AdminCompactBtn>
        }
      >
        {compare ? <RevisionDiff compare={compare} /> : null}
      </AdminModal>

      <AdminModal
        open={preview !== null}
        title={`Предпросмотр · ${SAMPLE_LABEL[sampleVariant]}`}
        wide
        onClose={() => setPreview(null)}
        footer={
          <AdminCompactBtn type="button" variant="accent" onClick={() => setPreview(null)}>
            Закрыть
          </AdminCompactBtn>
        }
      >
        {preview ? (
          <>
            <p className={local.previewSubject}>
              <span className={catalogStyles.mutedInline}>Тема: </span>
              {preview.subject}
            </p>
            <AdminTabs
              ariaLabel="Формат письма"
              variant="pill"
              activeId={previewTab}
              onChange={setPreviewTab}
              items={[
                { id: 'html', label: 'Как в почте' },
                { id: 'text', label: 'Текстовая версия' },
              ]}
            />
            {previewTab === 'html' ? (
              <iframe
                title="Предпросмотр письма"
                className={local.previewFrame}
                srcDoc={preview.html}
                sandbox=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <pre className={local.previewPlain}>{preview.text}</pre>
            )}
          </>
        ) : null}
      </AdminModal>
    </div>
  );
}

const DIFF_LINE_CLASS = { same: local.diffLine, add: `${local.diffLine} ${local.diffAdd}`, del: `${local.diffLine} ${local.diffDel}` };

function RevisionDiff({ compare }: { compare: RevisionCompare }) {
  const { before, after, afterLabel } = compare;
  const changedFields = TEMPLATE_FIELDS.filter((f) => before[f] !== after[f]);
  return (
    <>
      <p className={local.diffMeta}>
        Версия, заменённая {formatDateTime(before.createdAt)}
        {before.actorEmail ? ` (${before.actorEmail})` : ''} → {afterLabel}
      </p>
      {before.enabled !== after.enabled ? (
        <p className={local.diffMeta}>
          Отправка: {before.enabled ? 'включено' : 'выключено'} → {after.enabled ? 'включено' : 'выключено'}
        </p>
      ) : null}
      {changedFields.length === 0 ? <p className={local.diffMeta}>Текст письма не менялся.</p> : null}
      {changedFields.map((field) => (
        <section key={field} className={local.diffField}>
          <h3 className={local.diffFieldTitle}>{templateFieldLabel(field)}</h3>
          <pre className={local.diffBlock}>
            {diffLines(before[field], after[field]).map((line, i) => (
              <span key={i} className={DIFF_LINE_CLASS[line.kind]}>
                {line.text || ' '}
              </span>
            ))}
          </pre>
        </section>
      ))}
    </>
  );
}
