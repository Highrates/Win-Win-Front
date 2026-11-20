"use client";

import { useEffect, useId, useRef } from "react";
import { AdminCompactBtn } from "@/components/AdminCompactBtn/AdminCompactBtn";
import { AdminModal } from "@/components/admin/AdminModal/AdminModal";
import { Button } from "@/components/Button";
import { useModalFocusTrap } from "@/lib/useModalFocusTrap";
import type { RichBlockStrings } from "@/lib/richBlockI18n";
import type { RichBlockVariant } from "./richBlockTypes";
import styles from "./RichBlock.module.css";

type Props = {
  open: boolean;
  fieldId: string;
  variant: RichBlockVariant;
  linkDraft: string;
  linkError: string | null;
  linkHadExisting: boolean;
  strings: RichBlockStrings;
  onDraftChange: (value: string) => void;
  onClearError: () => void;
  onClose: () => void;
  onSubmit: () => void;
  onRemove: () => void;
};

function LinkFormFields({
  fieldId,
  linkDraft,
  linkError,
  strings: s,
  onDraftChange,
  onClearError,
  onSubmit,
}: {
  fieldId: string;
  linkDraft: string;
  linkError: string | null;
  strings: RichBlockStrings;
  onDraftChange: (value: string) => void;
  onClearError: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <label className={styles.linkField} htmlFor={`${fieldId}-link-url`}>
        {s.linkUrlLabel}
        <input
          id={`${fieldId}-link-url`}
          className={styles.linkInput}
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder={s.linkUrlPh}
          value={linkDraft}
          aria-invalid={linkError ? true : undefined}
          aria-describedby={
            linkError ? `${fieldId}-link-err` : `${fieldId}-link-hint`
          }
          onChange={(e) => {
            onDraftChange(e.target.value);
            if (linkError) onClearError();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
      </label>
      <p id={`${fieldId}-link-hint`} className={styles.linkHint}>
        {s.linkHint}
      </p>
      {linkError ? (
        <p id={`${fieldId}-link-err`} className={styles.linkError} role="alert">
          {linkError}
        </p>
      ) : null}
    </>
  );
}

function AccountLinkPopover({
  open,
  fieldId,
  linkDraft,
  linkError,
  linkHadExisting,
  strings: s,
  onDraftChange,
  onClearError,
  onClose,
  onSubmit,
  onRemove,
}: Omit<Props, "variant">) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.accountLinkOverlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={styles.accountLinkPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.accountLinkHead}>
          <h2 id={titleId} className={styles.accountLinkTitle}>
            {s.linkDialogTitle}
          </h2>
          <button
            type="button"
            className={styles.accountLinkClose}
            aria-label={s.linkDialogClose}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles.accountLinkBody}>
          <LinkFormFields
            fieldId={fieldId}
            linkDraft={linkDraft}
            linkError={linkError}
            strings={s}
            onDraftChange={onDraftChange}
            onClearError={onClearError}
            onSubmit={onSubmit}
          />
        </div>
        <div className={styles.accountLinkFooter}>
          {linkHadExisting ? (
            <Button type="button" variant="secondary" onClick={onRemove}>
              {s.linkRemove}
            </Button>
          ) : null}
          <div className={styles.accountLinkFooterEnd}>
            <Button type="button" variant="secondary" onClick={onClose}>
              {s.linkCancel}
            </Button>
            <Button type="button" variant="primary" onClick={onSubmit}>
              {s.linkApply}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RichBlockLinkDialog({
  open,
  fieldId,
  variant,
  linkDraft,
  linkError,
  linkHadExisting,
  strings: s,
  onDraftChange,
  onClearError,
  onClose,
  onSubmit,
  onRemove,
}: Props) {
  if (variant === "account") {
    return (
      <AccountLinkPopover
        open={open}
        fieldId={fieldId}
        linkDraft={linkDraft}
        linkError={linkError}
        linkHadExisting={linkHadExisting}
        strings={s}
        onDraftChange={onDraftChange}
        onClearError={onClearError}
        onClose={onClose}
        onSubmit={onSubmit}
        onRemove={onRemove}
      />
    );
  }

  return (
    <AdminModal
      open={open}
      title={s.linkDialogTitle}
      onClose={onClose}
      closeLabel={s.linkDialogClose}
      footer={
        <div className={styles.linkFooter}>
          {linkHadExisting ? (
            <AdminCompactBtn
              type="button"
              variant="danger"
              className={styles.linkFooterStart}
              onClick={onRemove}
            >
              {s.linkRemove}
            </AdminCompactBtn>
          ) : null}
          <AdminCompactBtn type="button" variant="outline" onClick={onClose}>
            {s.linkCancel}
          </AdminCompactBtn>
          <AdminCompactBtn type="button" variant="accent" onClick={onSubmit}>
            {s.linkApply}
          </AdminCompactBtn>
        </div>
      }
    >
      <LinkFormFields
        fieldId={fieldId}
        linkDraft={linkDraft}
        linkError={linkError}
        strings={s}
        onDraftChange={onDraftChange}
        onClearError={onClearError}
        onSubmit={onSubmit}
      />
    </AdminModal>
  );
}
