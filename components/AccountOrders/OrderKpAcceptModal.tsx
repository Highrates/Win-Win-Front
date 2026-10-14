'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import {
  SlideInPanelModal,
  slideInPanelModalStyles as panelModal,
} from '@/components/SlideInPanelModal/SlideInPanelModal';
import { TextField } from '@/components/TextField';
import type { CustomerKpRequisitesPayload } from '@/lib/userOrders/clientApi';
import { acceptUserOrderCommercialProposal } from '@/lib/userOrders/clientApi';
import styles from './OrderKpAcceptModal.module.css';

type LegalType = CustomerKpRequisitesPayload['legalType'];

type ProfilePrefill = {
  firstName?: string | null;
  lastName?: string | null;
  legalType?: LegalType | null;
  companyName?: string | null;
  inn?: string | null;
  kpp?: string | null;
  legalAddress?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
};

type Props = {
  open: boolean;
  orderId: string;
  /** Версия КП, на которую клиент отвечает. */
  expectedVersion?: number | null;
  onClose: () => void;
  onAccepted: () => void;
};

const LEGAL_OPTIONS: { id: LegalType; label: string }[] = [
  { id: 'INDIVIDUAL', label: 'Физлицо' },
  { id: 'IE', label: 'ИП' },
  { id: 'LLC', label: 'ООО' },
];

function emptyForm(prefill?: ProfilePrefill | null): CustomerKpRequisitesPayload {
  const name = [prefill?.firstName, prefill?.lastName].filter(Boolean).join(' ').trim();
  return {
    legalType: prefill?.legalType ?? 'INDIVIDUAL',
    contactName: name,
    phone: '',
    companyName: prefill?.companyName ?? '',
    inn: prefill?.inn ?? '',
    kpp: prefill?.kpp ?? '',
    legalAddress: prefill?.legalAddress ?? '',
    bankName: prefill?.bankName ?? '',
    bankAccount: prefill?.bankAccount ?? '',
    bic: '',
    correspondentAccount: '',
  };
}

export function OrderKpAcceptModal({
  open,
  orderId,
  expectedVersion = null,
  onClose,
  onAccepted,
}: Props) {
  const [form, setForm] = useState<CustomerKpRequisitesPayload>(() => emptyForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const close = () => {
    if (busy) return;
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setBusy(false);
    setLoadingProfile(true);
    void (async () => {
      try {
        const res = await fetch('/api/user/profile', { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) throw new Error('Не удалось загрузить профиль');
        const p = (await res.json()) as ProfilePrefill;
        if (!cancelled) {
          setForm(emptyForm(p));
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setForm(emptyForm());
          setError(
            e instanceof Error
              ? `${e.message}. Заполните реквизиты вручную.`
              : 'Не удалось загрузить профиль. Заполните реквизиты вручную.',
          );
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  const orgFields = form.legalType !== 'INDIVIDUAL';

  function patch<K extends keyof CustomerKpRequisitesPayload>(key: K, value: CustomerKpRequisitesPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (expectedVersion == null || expectedVersion < 1) {
      setError('КП обновлено — обновите список заказов и попробуйте снова.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: CustomerKpRequisitesPayload = {
        legalType: form.legalType,
        contactName: form.contactName.trim(),
        phone: form.phone?.trim() || undefined,
        companyName: orgFields ? form.companyName?.trim() || undefined : undefined,
        inn: orgFields ? form.inn?.trim() || undefined : undefined,
        kpp: form.kpp?.trim() || undefined,
        legalAddress: form.legalAddress?.trim() || undefined,
        bankName: form.bankName?.trim() || undefined,
        bankAccount: form.bankAccount?.trim() || undefined,
        bic: form.bic?.trim() || undefined,
        correspondentAccount: form.correspondentAccount?.trim() || undefined,
      };
      await acceptUserOrderCommercialProposal(orderId, payload, expectedVersion);
      onAccepted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось подтвердить');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SlideInPanelModal
      open={open}
      onClose={close}
      ariaLabel="Подтверждение коммерческого предложения"
      backdropAriaLabel="Закрыть подтверждение КП"
      panelClassName={panelModal.panelMax560}
    >
      <div className={panelModal.inner}>
        <h3 className={panelModal.title}>Подтверждение КП</h3>
        <p className={styles.lead}>
          Вы подтверждаете состав и сумму предложения. Укажите реквизиты для счёта и договора: имя,
          организация и банк сохранятся в профиле. Телефон, БИК и корр. счёт — только для этого КП.
        </p>

        {loadingProfile ? <p className={styles.muted}>Загрузка профиля…</p> : null}

        <div className={styles.legalTypeRow} role="group" aria-label="Тип плательщика">
          {LEGAL_OPTIONS.map((o) => {
            const active = form.legalType === o.id;
            return (
              <button
                key={o.id}
                type="button"
                className={`${styles.legalTypeChip} ${active ? styles.legalTypeChipActive : ''}`}
                aria-pressed={active}
                disabled={busy || loadingProfile}
                onClick={() => patch('legalType', o.id)}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        <div className={styles.form}>
          <TextField
            label="Контактное имя *"
            value={form.contactName}
            disabled={busy || loadingProfile}
            onChange={(e) => patch('contactName', e.target.value)}
            autoComplete="name"
          />
          <TextField
            label="Телефон"
            value={form.phone ?? ''}
            disabled={busy || loadingProfile}
            onChange={(e) => patch('phone', e.target.value)}
            autoComplete="tel"
          />

          {orgFields ? (
            <>
              <TextField
                label="Название организации *"
                value={form.companyName ?? ''}
                disabled={busy || loadingProfile}
                onChange={(e) => patch('companyName', e.target.value)}
              />
              <div className={styles.fieldRow}>
                <TextField
                  label="ИНН *"
                  value={form.inn ?? ''}
                  disabled={busy || loadingProfile}
                  onChange={(e) => patch('inn', e.target.value)}
                />
                <TextField
                  label="КПП"
                  value={form.kpp ?? ''}
                  disabled={busy || loadingProfile}
                  onChange={(e) => patch('kpp', e.target.value)}
                />
              </div>
            </>
          ) : null}

          <TextField
            label="Юридический адрес"
            value={form.legalAddress ?? ''}
            disabled={busy || loadingProfile}
            onChange={(e) => patch('legalAddress', e.target.value)}
          />

          <p className={styles.sectionLabel}>Банковские реквизиты</p>
          <TextField
            label="Банк"
            value={form.bankName ?? ''}
            disabled={busy || loadingProfile}
            onChange={(e) => patch('bankName', e.target.value)}
          />
          <TextField
            label="Расчётный счёт"
            value={form.bankAccount ?? ''}
            disabled={busy || loadingProfile}
            onChange={(e) => patch('bankAccount', e.target.value)}
          />
          <div className={styles.fieldRow}>
            <TextField
              label="БИК"
              value={form.bic ?? ''}
              disabled={busy || loadingProfile}
              onChange={(e) => patch('bic', e.target.value)}
            />
            <TextField
              label="Корр. счёт"
              value={form.correspondentAccount ?? ''}
              disabled={busy || loadingProfile}
              onChange={(e) => patch('correspondentAccount', e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={panelModal.actions}>
          <Button type="button" variant="secondary" disabled={busy} onClick={close}>
            Отмена
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={busy || loadingProfile}
            onClick={() => void submit()}
          >
            {busy ? 'Сохранение…' : 'Подтвердить'}
          </Button>
        </div>
      </div>
    </SlideInPanelModal>
  );
}
