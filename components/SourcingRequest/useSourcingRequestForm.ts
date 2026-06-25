'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getCachedIsAuthenticated } from '@/lib/userSessionClient';
import { submitSourcingRequest } from '@/lib/userSourcingRequests/clientApi';
import {
  buildSourcingResumeCallbackUrl,
  clearSourcingDraft,
  loadSourcingDraft,
  saveSourcingDraft,
  SOURCING_DRAFT_LOAD_ERROR,
  SOURCING_DRAFT_SAVE_ERROR,
  type SourcingFormSnapshot,
} from './sourcingDraft';
import { SOURCING_MAX_PRODUCTS, validateSourcingIncomingFiles } from './sourcingLimits';
import {
  createEmptySourcingProduct,
  isSourcingFormDirty,
  revokeSourcingProducts,
  type SourcingFormAttachment,
  type SourcingProductItem,
  type SourcingReferenceImage,
} from './types';
import {
  hasSourcingFormErrors,
  isProductMinimallyFilled,
  isSoftValidProductLink,
  validateSourcingForm,
  type SourcingFormErrors,
} from './validation';

export type SourcingModalView = 'form' | 'auth-required' | 'success';

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type UseSourcingRequestFormOpts = {
  open: boolean;
  resumeDraft?: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function useSourcingRequestForm({
  open,
  resumeDraft = false,
  onClose,
  onSubmitted,
}: UseSourcingRequestFormOpts) {
  const firstProductRef = useRef(createEmptySourcingProduct());
  const [requestTitle, setRequestTitle] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [products, setProducts] = useState<SourcingProductItem[]>(() => [firstProductRef.current]);
  const [openProductId, setOpenProductId] = useState(() => firstProductRef.current.id);
  const [formAttachments, setFormAttachments] = useState<SourcingFormAttachment[]>([]);
  const [view, setView] = useState<SourcingModalView>('form');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<SourcingFormErrors>({});
  const resumeAppliedRef = useRef(false);
  const [resumeCallbackUrl, setResumeCallbackUrl] = useState(() => buildSourcingResumeCallbackUrl('/'));

  useEffect(() => {
    if (open) return;
    resumeAppliedRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    setResumeCallbackUrl(buildSourcingResumeCallbackUrl(window.location.pathname + window.location.search));
  }, [open]);

  const authLoginHref = `/login/email?callbackUrl=${encodeURIComponent(resumeCallbackUrl)}`;
  const authRegisterHref = `/register/email?callbackUrl=${encodeURIComponent(resumeCallbackUrl)}`;

  const buildSnapshot = useCallback((): SourcingFormSnapshot => {
    return {
      requestTitle,
      deliveryCity,
      products,
      formAttachments,
      openProductId,
    };
  }, [requestTitle, deliveryCity, products, formAttachments, openProductId]);

  const applySnapshot = useCallback((snapshot: SourcingFormSnapshot) => {
    setRequestTitle(snapshot.requestTitle);
    setDeliveryCity(snapshot.deliveryCity);
    setProducts(snapshot.products);
    setOpenProductId(snapshot.openProductId || snapshot.products[0]?.id || '');
    setFormAttachments(snapshot.formAttachments);
    setFormErrors({});
    setView('form');
  }, []);

  const resetFormState = useCallback(() => {
    const next = createEmptySourcingProduct();
    setProducts((prev) => {
      revokeSourcingProducts(prev);
      return [next];
    });
    setOpenProductId(next.id);
    setRequestTitle('');
    setDeliveryCity('');
    setFormAttachments([]);
    setView('form');
    setSubmitLoading(false);
    setFormErrors({});
    setDraftError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetFormState();
    setDiscardConfirmOpen(false);
    resumeAppliedRef.current = false;
    onClose();
  }, [onClose, resetFormState]);

  const requestClose = useCallback(() => {
    if (view === 'success') {
      handleClose();
      return;
    }
    if (view === 'auth-required') {
      setView('form');
      setSubmitError(null);
      resumeAppliedRef.current = false;
      onClose();
      return;
    }
    if (isSourcingFormDirty(requestTitle, deliveryCity, products, formAttachments)) {
      setDiscardConfirmOpen(true);
      return;
    }
    handleClose();
  }, [view, requestTitle, deliveryCity, products, formAttachments, handleClose, onClose]);

  const performSubmitFromSnapshot = useCallback(
    async (snapshot: SourcingFormSnapshot) => {
      setSubmitLoading(true);
      setSubmitError(null);
      try {
        await submitSourcingRequest(snapshot);
        await clearSourcingDraft();
        onSubmitted?.();
        setView('success');
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Не удалось отправить заявку');
        try {
          await saveSourcingDraft({ ...snapshot, pendingSubmit: false });
        } catch {
          setSubmitError(SOURCING_DRAFT_SAVE_ERROR);
        }
      } finally {
        setSubmitLoading(false);
      }
    },
    [onSubmitted],
  );

  useEffect(() => {
    if (!open || !resumeDraft || resumeAppliedRef.current) return;
    resumeAppliedRef.current = true;
    setDraftLoading(true);
    setDraftError(null);
    void loadSourcingDraft()
      .then(async (snapshot) => {
        if (!snapshot) return;
        applySnapshot(snapshot);
        if (!snapshot.pendingSubmit) return;
        const authed = await getCachedIsAuthenticated();
        if (!authed) return;
        await performSubmitFromSnapshot(snapshot);
      })
      .catch(() => {
        setDraftError(SOURCING_DRAFT_LOAD_ERROR);
      })
      .finally(() => setDraftLoading(false));
  }, [open, resumeDraft, performSubmitFromSnapshot, applySnapshot]);

  const updateProduct = useCallback((id: string, patch: Partial<SourcingProductItem>) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      setFormErrors((errors) => {
        const updated: SourcingFormErrors = { ...errors };
        if (updated.productsGeneral && next.some(isProductMinimallyFilled)) {
          updated.productsGeneral = undefined;
        }
        if (updated.productErrors?.[id]) {
          const fieldErrors = { ...updated.productErrors[id] };
          if ('productLink' in patch) {
            const link = (patch.productLink ?? next.find((p) => p.id === id)?.productLink ?? '').trim();
            if (!link || isSoftValidProductLink(link)) {
              delete fieldErrors.productLink;
            }
          }
          const productErrors = { ...updated.productErrors };
          if (Object.keys(fieldErrors).length > 0) productErrors[id] = fieldErrors;
          else delete productErrors[id];
          updated.productErrors = Object.keys(productErrors).length > 0 ? productErrors : undefined;
        }
        return updated;
      });
      return next;
    });
  }, []);

  const handleRequestTitleChange = useCallback((value: string) => {
    setRequestTitle(value);
    setFormErrors((prev) => (prev.requestTitle ? { ...prev, requestTitle: undefined } : prev));
  }, []);

  const addProduct = useCallback(() => {
    setProducts((prev) => {
      if (prev.length >= SOURCING_MAX_PRODUCTS) return prev;
      const item = createEmptySourcingProduct();
      setOpenProductId(item.id);
      return [...prev, item];
    });
  }, []);

  const rejectFilesError = useCallback((message: string) => {
    setFormErrors((prev) => ({ ...prev, filesGeneral: message }));
  }, []);

  const clearFilesError = useCallback(() => {
    setFormErrors((prev) => ({ ...prev, filesGeneral: undefined }));
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => {
      if (prev.length <= 1) return prev;
      const target = prev.find((p) => p.id === id);
      if (target) revokeSourcingProducts([target]);
      const next = prev.filter((p) => p.id !== id);
      setOpenProductId((current) => {
        if (current !== id) return current;
        return next[next.length - 1]?.id ?? '';
      });
      return next;
    });
  }, []);

  const addReferenceImages = useCallback(
    (productId: string, files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (!list.length) return;
      const err = validateSourcingIncomingFiles(list, products, formAttachments, { productId });
      if (err) {
        rejectFilesError(err);
        return;
      }
      clearFilesError();
      const added: SourcingReferenceImage[] = list.map((file) => ({
        id: newId(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, referenceImages: [...p.referenceImages, ...added] } : p,
        ),
      );
    },
    [products, formAttachments, rejectFilesError, clearFilesError],
  );

  const removeReferenceImage = useCallback((productId: string, imageId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const image = p.referenceImages.find((img) => img.id === imageId);
        if (image?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(image.previewUrl);
        return { ...p, referenceImages: p.referenceImages.filter((img) => img.id !== imageId) };
      }),
    );
  }, []);

  const addFormAttachments = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      const err = validateSourcingIncomingFiles(list, products, formAttachments);
      if (err) {
        rejectFilesError(err);
        return;
      }
      clearFilesError();
      setFormAttachments((prev) => [...prev, ...list.map((file) => ({ id: newId(), file }))]);
    },
    [products, formAttachments, rejectFilesError, clearFilesError],
  );

  const removeFormAttachment = useCallback((id: string) => {
    setFormAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const performSubmit = useCallback(async () => {
    await performSubmitFromSnapshot(buildSnapshot());
  }, [buildSnapshot, performSubmitFromSnapshot]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validateSourcingForm(requestTitle, products, formAttachments);
      if (hasSourcingFormErrors(errors)) {
        setFormErrors(errors);
        if (errors.requestTitle) {
          document.getElementById('sourcing-request-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          document.getElementById('sourcing-request-title')?.focus();
        } else if (errors.productErrors) {
          const firstInvalidId = Object.keys(errors.productErrors)[0];
          if (firstInvalidId) setOpenProductId(firstInvalidId);
        } else if (errors.productsGeneral && products[0]) {
          setOpenProductId(products[0].id);
        }
        return;
      }
      setFormErrors({});
      const authed = await getCachedIsAuthenticated();
      if (!authed) {
        setSubmitLoading(true);
        setSubmitError(null);
        try {
          await saveSourcingDraft(buildSnapshot(), { pendingSubmit: true });
          setView('auth-required');
        } catch {
          setSubmitError(SOURCING_DRAFT_SAVE_ERROR);
        } finally {
          setSubmitLoading(false);
        }
        return;
      }
      await performSubmit();
    },
    [requestTitle, products, formAttachments, buildSnapshot, performSubmit],
  );

  return {
    view,
    draftLoading,
    draftError,
    submitLoading,
    submitError,
    discardConfirmOpen,
    setDiscardConfirmOpen,
    requestTitle,
    deliveryCity,
    products,
    openProductId,
    setOpenProductId,
    formAttachments,
    formErrors,
    authLoginHref,
    authRegisterHref,
    handleClose,
    requestClose,
    handleRequestTitleChange,
    setDeliveryCity,
    addProduct,
    removeProduct,
    updateProduct,
    addReferenceImages,
    removeReferenceImage,
    addFormAttachments,
    removeFormAttachment,
    handleSubmit,
    setView,
  };
}
