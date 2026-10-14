'use client';

import { useCallback, useEffect, useState } from 'react';
import { dispatchAccountWorkFeedRefreshEvent } from '@/lib/account/orders';
import { recordUserOrderCommercialProposalDecision } from '@/lib/userOrders/clientApi';

export type PendingKpChatDecision = 'CHANGES_REQUESTED' | 'REJECTED';

type Options = {
  orderId: string;
  /** Версия КП для optimistic concurrency. */
  commercialProposalVersion?: number | null;
  canRespondToCommercialProposal?: boolean;
  hasUnseenCommercialProposal?: boolean;
  sendChatText: (text: string) => Promise<boolean>;
  /** Сообщение, если версия КП устарела. */
  staleVersionMessage?: string;
  /** После успешного ответа (правки/отклонение) — обновить локальный state родителя. */
  onResponded?: (decision: PendingKpChatDecision) => void;
  /** После принятия КП с реквизитами. */
  onAccepted?: () => void;
};

/**
 * Общий KP-флоу ответа клиента: чат с decision → message, follow-up причины, accept modal state.
 */
export function useOrderKpResponse({
  orderId,
  commercialProposalVersion = null,
  canRespondToCommercialProposal = false,
  hasUnseenCommercialProposal = false,
  sendChatText,
  staleVersionMessage = 'КП обновлено — обновите список заказов и попробуйте снова.',
  onResponded,
  onAccepted,
}: Options) {
  const [chatOpen, setChatOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [canRespondKp, setCanRespondKp] = useState(canRespondToCommercialProposal);
  const [displayKpUnseen, setDisplayKpUnseen] = useState(hasUnseenCommercialProposal);
  const [pendingKpDecision, setPendingKpDecision] = useState<PendingKpChatDecision | null>(null);
  const [kpReasonFollowUp, setKpReasonFollowUp] = useState(false);
  const [chatSeedDraft, setChatSeedDraft] = useState<string | null>(null);
  const [composerBanner, setComposerBanner] = useState<string | null>(null);

  useEffect(() => {
    setCanRespondKp(canRespondToCommercialProposal);
  }, [canRespondToCommercialProposal, orderId]);

  useEffect(() => {
    setDisplayKpUnseen(hasUnseenCommercialProposal);
  }, [hasUnseenCommercialProposal, orderId]);

  const resetChatComposer = useCallback(() => {
    setPendingKpDecision(null);
    setComposerBanner(null);
    setChatSeedDraft(null);
  }, []);

  const closeChat = useCallback(() => {
    setChatOpen(false);
    setPendingKpDecision(null);
    setComposerBanner(null);
    setChatSeedDraft(null);
    /* kpReasonFollowUp оставляем — можно открыть чат снова и дослать */
  }, []);

  const finishKpRespondUi = useCallback(
    (decided?: PendingKpChatDecision | null) => {
      const decisionValue = decided ?? pendingKpDecision;
      setPendingKpDecision(null);
      setKpReasonFollowUp(false);
      setComposerBanner(null);
      setChatSeedDraft(null);
      setCanRespondKp(false);
      setDisplayKpUnseen(false);
      dispatchAccountWorkFeedRefreshEvent();
      if (decisionValue) onResponded?.(decisionValue);
    },
    [onResponded, pendingKpDecision],
  );

  const openChat = useCallback(() => {
    setPendingKpDecision(null);
    if (kpReasonFollowUp) {
      setComposerBanner(
        'Решение сохранено, но сообщение не ушло. Отправьте причину ещё раз — без повторной фиксации решения.',
      );
    } else {
      setChatSeedDraft(null);
      setComposerBanner(null);
    }
    setAcceptOpen(false);
    setChatOpen(true);
  }, [kpReasonFollowUp]);

  /** Открыть accept поверх карточки: чат закрываем, чтобы Escape не снимал оба слоя. */
  const openAccept = useCallback(() => {
    setChatOpen(false);
    setPendingKpDecision(null);
    setComposerBanner(null);
    setChatSeedDraft(null);
    setAcceptOpen(true);
  }, []);

  const openKpChat = useCallback((decision: PendingKpChatDecision) => {
    setPendingKpDecision(decision);
    setKpReasonFollowUp(false);
    if (decision === 'REJECTED') {
      setComposerBanner('Опишите причину отклонения и отправьте сообщение — мы зафиксируем отказ.');
      setChatSeedDraft('Хочу отклонить коммерческое предложение. Причина: ');
    } else {
      setComposerBanner('Опишите, что нужно изменить в КП, и отправьте сообщение.');
      setChatSeedDraft('Прошу изменить коммерческое предложение: ');
    }
    setChatOpen(true);
  }, []);

  const handleChatSend = useCallback(
    async (text: string): Promise<boolean> => {
      if (pendingKpDecision) {
        const decision = pendingKpDecision;
        const version = commercialProposalVersion;
        if (version == null || version < 1) {
          setComposerBanner(staleVersionMessage);
          return false;
        }
        try {
          await recordUserOrderCommercialProposalDecision(orderId, decision, version);
        } catch (e) {
          setComposerBanner(
            e instanceof Error
              ? e.message
              : 'Не удалось зафиксировать решение. Сообщение не отправлено — попробуйте ещё раз.',
          );
          return false;
        }

        const ok = await sendChatText(text);
        if (!ok) {
          setPendingKpDecision(null);
          setKpReasonFollowUp(true);
          setCanRespondKp(false);
          setDisplayKpUnseen(false);
          setComposerBanner(
            'Решение сохранено, но сообщение не ушло. Отправьте причину ещё раз — без повторной фиксации решения.',
          );
          dispatchAccountWorkFeedRefreshEvent();
          return false;
        }
        finishKpRespondUi(decision);
        return true;
      }

      if (kpReasonFollowUp) {
        const ok = await sendChatText(text);
        if (!ok) {
          setComposerBanner('Не удалось отправить причину. Нажмите «Отправить» ещё раз.');
          return false;
        }
        finishKpRespondUi();
        return true;
      }

      return sendChatText(text);
    },
    [
      commercialProposalVersion,
      finishKpRespondUi,
      kpReasonFollowUp,
      orderId,
      pendingKpDecision,
      sendChatText,
      staleVersionMessage,
    ],
  );

  const markAccepted = useCallback(() => {
    setCanRespondKp(false);
    setDisplayKpUnseen(false);
    setAcceptOpen(false);
    dispatchAccountWorkFeedRefreshEvent();
    onAccepted?.();
  }, [onAccepted]);

  const chatInputPlaceholder =
    kpReasonFollowUp
      ? 'Дослать причину…'
      : pendingKpDecision === 'REJECTED'
        ? 'Причина отклонения…'
        : pendingKpDecision === 'CHANGES_REQUESTED'
          ? 'Что изменить в КП…'
          : 'Сообщение';

  return {
    chatOpen,
    setChatOpen,
    acceptOpen,
    setAcceptOpen,
    openAccept,
    canRespondKp,
    setCanRespondKp,
    displayKpUnseen,
    setDisplayKpUnseen,
    pendingKpDecision,
    kpReasonFollowUp,
    chatSeedDraft,
    composerBanner,
    chatInputPlaceholder,
    openChat,
    openKpChat,
    closeChat,
    resetChatComposer,
    handleChatSend,
    markAccepted,
    showKpActions: canRespondKp,
  };
}
