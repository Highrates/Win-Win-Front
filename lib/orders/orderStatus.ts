/**
 * Реэкспорт `@win-win/order-status` для алиаса `@/lib/orders/orderStatus`.
 * Импорт → export (не `export { … } from`), чтобы webpack/Turbopack видели именованные экспорты.
 */
import {
  ADMIN_ACTIVE_STATUSES,
  ADMIN_COMPLETED_STATUSES,
  CUSTOMER_IN_WORK_STATUSES,
  CUSTOMER_IN_WORK_STATUSES_LIST,
  KP_PUBLISH_NEXT_STATUSES,
  ORDER_STATUS_DRAFT,
  ORDER_STATUS_FLOW,
  orderStatusLabel,
  type KpPublishNextOrderStatus,
  type OrderStatusCode,
  type OrderStatusFlow,
} from '@win-win/order-status';

export {
  ADMIN_ACTIVE_STATUSES,
  ADMIN_COMPLETED_STATUSES,
  CUSTOMER_IN_WORK_STATUSES,
  CUSTOMER_IN_WORK_STATUSES_LIST,
  KP_PUBLISH_NEXT_STATUSES,
  ORDER_STATUS_DRAFT,
  ORDER_STATUS_FLOW,
  orderStatusLabel,
  type KpPublishNextOrderStatus,
  type OrderStatusCode,
  type OrderStatusFlow,
};
