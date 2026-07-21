'use client';

import { useCallback, useState } from 'react';

export function useSourcingPromoFlow() {
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeDraft, setResumeDraft] = useState(false);
  const [draftRefreshKey, setDraftRefreshKey] = useState(0);

  const bumpDraftBanner = useCallback(() => {
    setDraftRefreshKey((key) => key + 1);
  }, []);

  const openFreshModal = useCallback(() => {
    setResumeDraft(false);
    setModalOpen(true);
  }, []);

  const openDraftModal = useCallback(() => {
    setResumeDraft(true);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setResumeDraft(false);
    bumpDraftBanner();
  }, [bumpDraftBanner]);

  return {
    draftRefreshKey,
    openFreshModal,
    openDraftModal,
    modalProps: {
      open: modalOpen,
      resumeDraft,
      onClose: closeModal,
      onSubmitted: bumpDraftBanner,
    },
  };
}
