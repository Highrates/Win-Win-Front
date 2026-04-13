import type { Metadata } from 'next';
import { RegisterFlow } from '@/components/auth-forms/RegisterFlow';

export const metadata: Metadata = {
  title: 'Регистрация по email — Win-Win',
  description: 'Создание аккаунта по email',
};

export default function RegisterEmailPage() {
  return <RegisterFlow channel="email" />;
}
