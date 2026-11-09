import styles from './AdminStatusChip.module.css';

type Tone = 'new' | 'progress' | 'success' | 'warning' | 'danger' | 'neutral';

const ORDER_TONE: Record<string, Tone> = {
  PENDING_APPROVAL: 'new',
  PROPOSAL_FORMED: 'progress',
  APPROVED: 'success',
  PENDING_SIGNATURE: 'warning',
  PENDING_PAYMENT: 'warning',
  PAID: 'success',
  PENDING_SHIPMENT: 'progress',
  IN_TRANSIT: 'progress',
  DELIVERED_TO_RU_WAREHOUSE: 'progress',
  RECEIVED: 'success',
  COMPLETED: 'neutral',
  DRAFT: 'neutral',
};

const SOURCING_TONE: Record<string, Tone> = {
  PENDING_REVIEW: 'new',
  IN_PROGRESS: 'progress',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};

export function adminStatusTone(status: string, kind: 'order' | 'sourcing' = 'order'): Tone {
  const map = kind === 'sourcing' ? SOURCING_TONE : ORDER_TONE;
  return map[status] ?? 'neutral';
}

export function AdminStatusChip({
  label,
  status,
  kind = 'order',
}: {
  label: string;
  status: string;
  kind?: 'order' | 'sourcing';
}) {
  const tone = adminStatusTone(status, kind);
  return <span className={`${styles.chip} ${styles[`tone_${tone}`]}`}>{label}</span>;
}
