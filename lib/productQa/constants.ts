/** Синхрон с backend `product-qa.constants.ts`. */
export const PRODUCT_QA_MESSAGES_PAGE_DEFAULT = 30;
export const PRODUCT_QA_MESSAGES_PAGE_MAX = 100;
export const PRODUCT_QA_BODY_MAX_CHARS = 4000;
export const PRODUCT_QA_POST_COOLDOWN_MS = 15_000;
export const PRODUCT_QA_EDIT_WITHIN_MS = 15 * 60 * 1000;
export const PRODUCT_QA_ATTACHMENTS_MAX = 4;
export const PRODUCT_QA_UPLOAD_MAX_FILE_BYTES = 8 * 1024 * 1024;

export const PRODUCT_QA_SECTION_ID = 'product-qa';

/** Якорь панели Q&A в форме товара админки (модерация витрины). */
export const PRODUCT_QA_ADMIN_PANEL_ID = 'qa';

/** Якорь панели private correspondence в форме товара (toast deep-link). */
export const PRODUCT_CORRESPONDENCE_ADMIN_PANEL_ID = 'product-correspondence';

export const PRODUCT_QA_DEFAULT_TOPIC_SLUG = 'general';

/** Fallback polling при недоступности WebSocket (мс). */
export const PRODUCT_QA_POLL_INTERVAL_MS = 45_000;

/** Socket.IO namespace (синхрон с backend). */
export const PRODUCT_QA_SOCKET_NAMESPACE = '/product-qa';

export const PRODUCT_QA_WS_EVENTS = {
  messageCreated: 'message_created',
  messageUpdated: 'message_updated',
  messageHidden: 'message_hidden',
  metaUpdated: 'meta_updated',
  staffNewQuestion: 'staff_new_question',
  staffQaMessageCreated: 'staff_qa_message_created',
  staffQaMessageUpdated: 'staff_qa_message_updated',
  correspondenceMessageCreated: 'correspondence_message_created',
  correspondenceMessageUpdated: 'correspondence_message_updated',
} as const;

/** DOM: staff pending Q&A message (WS staff room). */
export const ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_EVENT = 'admin-product-qa-staff-qa-message';

/** DOM: staff Q&A message update (non-visible statuses). */
export const ADMIN_PRODUCT_QA_STAFF_QA_MESSAGE_UPDATED_EVENT =
  'admin-product-qa-staff-qa-message-updated';

/** DOM: обновить бейдж очереди Q&A (pending-summary) в админке. */
export const ADMIN_PRODUCT_QA_PENDING_REFRESH_EVENT = 'admin-product-qa-pending-refresh';

/** DOM: обновить бейдж непрочитанных Q&A в админке. */
export const ADMIN_PRODUCT_QA_UNREAD_REFRESH_EVENT = 'admin-product-qa-unread-refresh';

/** DOM: staff_new_question (detail = ProductQaStaffNewQuestionPayload). */
export const ADMIN_PRODUCT_QA_STAFF_NEW_QUESTION_EVENT = 'admin-product-qa-staff-new-question';

/** Cloudflare Turnstile site key (опционально). Legacy alias — см. `@/lib/turnstile`. */
export { TURNSTILE_SITE_KEY as PRODUCT_QA_TURNSTILE_SITE_KEY } from '@/lib/turnstile';
