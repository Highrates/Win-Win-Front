import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterFlow } from '@/components/auth-forms/RegisterFlow';
import { redirectIfUserAuthenticated } from '@/lib/authGuestServer';

export const metadata: Metadata = {
  title: 'Регистрация по телефону — Win-Win',
  description: 'Создание аккаунта по номеру телефона',
};

export default async function RegisterPhonePage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  await redirectIfUserAuthenticated(searchParams?.callbackUrl);
  return (
    <Suspense fallback={null}>
      <RegisterFlow channel="phone" />
    </Suspense>
  );
}
