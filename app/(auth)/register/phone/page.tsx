import type { Metadata } from 'next';
import { RegisterFlow } from '@/components/auth-forms/RegisterFlow';

export const metadata: Metadata = {
  title: 'Регистрация по телефону — Win-Win',
  description: 'Создание аккаунта по номеру телефона',
};

export default function RegisterPhonePage() {
  return <RegisterFlow channel="phone" />;
}
