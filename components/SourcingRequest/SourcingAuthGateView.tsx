import Link from 'next/link';
import { Button } from '@/components/Button/Button';
import buttonStyles from '@/components/Button/Button.module.css';
import panelModal from '@/components/SlideInPanelModal/slideInPanelModal.module.css';
import styles from './SourcingRequestModal.module.css';

type Props = {
  authLoginHref: string;
  authRegisterHref: string;
  onBackToForm: () => void;
};

export function SourcingAuthGateView({ authLoginHref, authRegisterHref, onBackToForm }: Props) {
  return (
    <div className={styles.authGate}>
      <p className={styles.authGateTitle}>Войдите, чтобы отправить</p>
      <p className={styles.authGateText}>
        Черновик заявки сохранён на 24 часа. После входа заявка отправится автоматически.
      </p>
      <div className={panelModal.actions}>
        <Link href={authLoginHref} className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}>
          Войти
        </Link>
        <Link href={authRegisterHref} className={`${buttonStyles.btn} ${buttonStyles.btnSecondary}`}>
          Регистрация
        </Link>
        <Button type="button" variant="secondary" onClick={onBackToForm}>
          Вернуться к форме
        </Button>
      </div>
    </div>
  );
}
