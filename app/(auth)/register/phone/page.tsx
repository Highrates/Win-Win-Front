import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterFlow } from '@/components/auth-forms/RegisterFlow';

export const metadata: Metadata = {
  title: 'Регистрация по телефону — Win-Win',
  description: 'Создание аккаунта по номеру телефона',
};

export default function RegisterPhonePage() {
  return (
    <Suspense fallback={null}>
      <RegisterFlow channel="phone" />
    </Suspense>
  );
}
