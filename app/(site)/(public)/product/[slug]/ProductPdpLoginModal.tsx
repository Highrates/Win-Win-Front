'use client';

import Link from 'next/link';
import { LoginEmailForm } from '@/components/auth-forms';
import { SlideInPanelModal } from '@/components/SlideInPanelModal/SlideInPanelModal';
import authStyles from '@/components/AuthPageShell/AuthPageShell.module.css';
import styles from './ProductPdpLoginModal.module.css';

type Props = {
  open: boolean;
  callbackUrl: string;
  onClose: () => void;
  onAuthenticated: () => void;
};

export function ProductPdpLoginModal({ open, callbackUrl, onClose, onAuthenticated }: Props) {
  return (
    <SlideInPanelModal open={open} onClose={onClose} ariaLabel="Вход в аккаунт">
      <div className={styles.content}>
        <h2 className={styles.title}>Вход в аккаунт</h2>
        <p className={styles.lead}>Чтобы добавить товар в заказ или проект, войдите в аккаунт.</p>
        <LoginEmailForm callbackUrl={callbackUrl} onAuthenticated={onAuthenticated} />
        <p className={styles.registerHint}>
          Впервые у нас?{' '}
          <Link
            href={`/register/email?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className={authStyles.authLinkAccent}
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </SlideInPanelModal>
  );
}
