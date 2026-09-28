import { Button } from '@/components/Button';
import styles from './AccountErrorState.module.css';

type Props = {
  /** Текст для пользователя (см. `accountLoadErrorMessage`). */
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/** Единое состояние ошибки загрузки в ЛК: сообщение + кнопка повтора. */
export function AccountErrorState({ message, onRetry, retryLabel = 'Повторить', className }: Props) {
  return (
    <div className={`${styles.root} ${className ?? ''}`.trim()} role="alert">
      <p className={styles.message}>{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
