'use client';

import { useEffect, useRef, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import type { adminDashboardAnalyticsStrings } from '@/lib/admin-i18n/adminDashboardAnalyticsI18n';
import {
  parseDateInputValue,
  rangeForPreset,
  rangeFromInclusiveDays,
  startOfCompare,
  type DashboardDateRange,
  type DashboardPeriodPreset,
} from '@/lib/adminDashboard/dashboardPeriod';
import styles from './AdminDashboard.module.css';

type Strings = ReturnType<typeof adminDashboardAnalyticsStrings>;

type Props = {
  s: Strings;
  preset: DashboardPeriodPreset;
  appliedFrom: string;
  appliedTo: string;
  customChipLabel: string;
  metricsLoading: boolean;
  onSelectPreset: (preset: 'today' | 'month', range: DashboardDateRange) => void;
  onApplyCustom: (range: DashboardDateRange, fromYmd: string, toYmd: string) => void;
};

export function AdminDashboardPeriodBar({
  s,
  preset,
  appliedFrom,
  appliedTo,
  customChipLabel,
  metricsLoading,
  onSelectPreset,
  onApplyCustom,
}: Props) {
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(appliedFrom);
  const [draftTo, setDraftTo] = useState(appliedTo);
  const periodMenuRef = useRef<HTMLDivElement>(null);

  const customPending = draftFrom !== appliedFrom || draftTo !== appliedTo;

  useEffect(() => {
    if (!periodMenuOpen) return;
    const onPointer = (e: MouseEvent) => {
      const el = periodMenuRef.current;
      if (el && !el.contains(e.target as Node)) setPeriodMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPeriodMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [periodMenuOpen]);

  const applyCustomRange = () => {
    const from = parseDateInputValue(draftFrom);
    const to = parseDateInputValue(draftTo);
    if (!from || !to || startOfCompare(from) > startOfCompare(to)) return;
    setPeriodMenuOpen(false);
    onApplyCustom(rangeFromInclusiveDays(from, to), draftFrom, draftTo);
  };

  return (
    <div className={styles.periodBar}>
      <div className={styles.periodChips} role="radiogroup" aria-label={s.chipPeriod}>
        <AdminCompactBtn
          type="button"
          role="radio"
          aria-checked={preset === 'today'}
          variant={preset === 'today' ? 'accent' : 'outline'}
          onClick={() => onSelectPreset('today', rangeForPreset('today'))}
        >
          {s.chipToday}
        </AdminCompactBtn>
        <AdminCompactBtn
          type="button"
          role="radio"
          aria-checked={preset === 'month'}
          variant={preset === 'month' ? 'accent' : 'outline'}
          onClick={() => onSelectPreset('month', rangeForPreset('month'))}
        >
          {s.chipMonth}
        </AdminCompactBtn>

        <div className={styles.periodChipWrap} ref={periodMenuRef}>
          <AdminCompactBtn
            type="button"
            role="radio"
            aria-checked={preset === 'custom'}
            aria-expanded={periodMenuOpen}
            aria-haspopup="dialog"
            variant={preset === 'custom' ? 'accent' : 'outline'}
            onClick={() => {
              if (periodMenuOpen) {
                setPeriodMenuOpen(false);
                return;
              }
              setDraftFrom(appliedFrom);
              setDraftTo(appliedTo);
              setPeriodMenuOpen(true);
            }}
          >
            {customChipLabel}
          </AdminCompactBtn>

          {periodMenuOpen ? (
            <div className={styles.periodPopover} role="dialog" aria-label={s.chipPeriod}>
              <label className={styles.periodDateField}>
                <span className={styles.periodDateLabel}>{s.periodFrom}</span>
                <input
                  className={styles.periodDateInput}
                  type="date"
                  value={draftFrom}
                  max={draftTo}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
              </label>
              <label className={styles.periodDateField}>
                <span className={styles.periodDateLabel}>{s.periodTo}</span>
                <input
                  className={styles.periodDateInput}
                  type="date"
                  value={draftTo}
                  min={draftFrom}
                  onChange={(e) => setDraftTo(e.target.value)}
                />
              </label>
              <div className={styles.periodPopoverActions}>
                <AdminCompactBtn
                  type="button"
                  variant="outline"
                  onClick={() => setPeriodMenuOpen(false)}
                >
                  {s.periodCancel}
                </AdminCompactBtn>
                <AdminCompactBtn
                  type="button"
                  variant="accent"
                  disabled={
                    !draftFrom ||
                    !draftTo ||
                    (!customPending && preset === 'custom') ||
                    metricsLoading
                  }
                  onClick={applyCustomRange}
                >
                  {s.periodApply}
                </AdminCompactBtn>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
