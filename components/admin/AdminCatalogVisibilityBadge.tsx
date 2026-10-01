import styles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';

type Props = {
  isActive: boolean;
  publishedLabel: string;
  hiddenLabel: string;
  className?: string;
};

/** Статус-чип витрины: зелёный «Опубликовано» / серый «Скрыто». */
export function AdminCatalogVisibilityBadge({
  isActive,
  publishedLabel,
  hiddenLabel,
  className,
}: Props) {
  return (
    <span
      className={`${styles.badge} ${isActive ? styles.badgeOn : styles.badgeOff}${className ? ` ${className}` : ''}`}
    >
      {isActive ? publishedLabel : hiddenLabel}
    </span>
  );
}
