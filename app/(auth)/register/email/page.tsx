import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterFlow } from '@/components/auth-forms/RegisterFlow';

export const metadata: Metadata = {
  title: 'Регистрация по email — Win-Win',
  description: 'Создание аккаунта по email',
};

export default function RegisterEmailPage() {
  return (
    <Suspense fallback={null}>
      <RegisterFlow channel="email" />
    </Suspense>
  );
}
