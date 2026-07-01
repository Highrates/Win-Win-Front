'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminSourcingStrings } from '@/lib/admin-i18n/adminOrdersI18n';
import {
  fetchPricingReversePreview,
  TYPICAL_SOURCING_VOLUME_M3,
  TYPICAL_SOURCING_WEIGHT_KG,
} from '@/lib/pricing/sourcingPricingPreview';
import { parseExpectedBudgetRetailRub } from '@win-win/sourcing-request';
import sd from './sourcingAdminDetail.module.css';

function parsePositiveFloat(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return null;
  const forParse = normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
  if (!forParse) return null;
  const n = Number(forParse);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatRubAmount(value: number, locale: 'ru' | 'zh'): string {
  return `${value.toLocaleString(locale === 'zh' ? 'zh-CN' : 'ru-RU')} ₽`;
}

type Props = {
  expectedBudget: string | null;
};

export function AdminSourcingImpliedCny({ expectedBudget }: Props) {
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminSourcingStrings(locale), [locale]);
  const retailRub = parseExpectedBudgetRetailRub(expectedBudget);

  const [weightStr, setWeightStr] = useState(String(TYPICAL_SOURCING_WEIGHT_KG));
  const [volumeStr, setVolumeStr] = useState(String(TYPICAL_SOURCING_VOLUME_M3));
  const [costCny, setCostCny] = useState<number | null>(null);
  const [overBudgetHint, setOverBudgetHint] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<'NO_PROFILE' | 'NEGATIVE_CNY' | 'INVALID' | null>(null);
  const [loading, setLoading] = useState(false);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (retailRub == null) {
      setCostCny(null);
      setOverBudgetHint(null);
      setErrorKey(null);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const weightKg = parsePositiveFloat(weightStr);
      const volumeM3 = parsePositiveFloat(volumeStr);
      if (weightKg == null || volumeM3 == null) {
        const weightEmpty = !weightStr.trim();
        const volumeEmpty = !volumeStr.trim();
        if (weightEmpty || volumeEmpty) return;
        setErrorKey('INVALID');
        setOverBudgetHint(null);
        return;
      }

      const seq = ++requestSeqRef.current;
      setLoading(true);

      void (async () => {
        try {
          const r = await fetchPricingReversePreview({ retailRub, weightKg, volumeM3 });
          if (seq !== requestSeqRef.current) return;

          if (!r.ok) {
            setCostCny(null);
            setOverBudgetHint(null);
            setErrorKey(
              r.error === 'NO_PROFILE'
                ? 'NO_PROFILE'
                : r.error === 'NEGATIVE_CNY'
                  ? 'NEGATIVE_CNY'
                  : 'INVALID',
            );
            return;
          }

          setCostCny(r.costPriceCny);
          setErrorKey(null);
          setOverBudgetHint(
            r.fitsBudget
              ? null
              : t.impliedCnyOverBudget(
                  formatRubAmount(r.retailAtDims, locale),
                  formatRubAmount(retailRub, locale),
                ),
          );
        } catch {
          if (seq !== requestSeqRef.current) return;
          setCostCny(null);
          setOverBudgetHint(null);
          setErrorKey('INVALID');
        } finally {
          if (seq === requestSeqRef.current) setLoading(false);
        }
      })();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [retailRub, weightStr, volumeStr, locale, t]);

  if (retailRub == null) return null;

  const errorText =
    errorKey === 'NO_PROFILE'
      ? t.impliedCnyNoProfile
      : errorKey === 'NEGATIVE_CNY'
        ? t.impliedCnyTooLow
        : errorKey === 'INVALID'
          ? t.impliedCnyInvalid
          : null;

  return (
    <div className={sd.impliedCnyBlock}>
      <div className={sd.productRow}>
        <p className={sd.productLabel}>{t.impliedCnyLabel}</p>
        <p className={sd.productValue}>
          {loading ? t.impliedCnyLoading : costCny != null ? `≈ ¥ ${costCny.toLocaleString(locale === 'zh' ? 'zh-CN' : 'ru-RU')}` : '—'}
        </p>
      </div>
      {errorText ? (
        <p className={sd.impliedCnyHint} role="alert">
          {errorText}
        </p>
      ) : null}
      {overBudgetHint ? (
        <p className={`${sd.impliedCnyHint} ${sd.impliedCnyWarn}`} role="status">
          {overBudgetHint}
        </p>
      ) : null}
      <p className={sd.impliedCnyHint}>{t.impliedCnyDimsHint}</p>
      <div className={sd.impliedCnyDims}>
        <AdminTextField
          label={t.grossWeightLabel}
          type="text"
          inputMode="decimal"
          value={weightStr}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightStr(e.target.value)}
          className={sd.impliedCnyField}
        />
        <AdminTextField
          label={t.volumeLabel}
          type="text"
          inputMode="decimal"
          value={volumeStr}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVolumeStr(e.target.value)}
          className={sd.impliedCnyField}
        />
      </div>
      <p className={`${sd.impliedCnyHint} ${sd.impliedCnyProfileHint}`}>{t.impliedCnyProfileHint}</p>
    </div>
  );
}
