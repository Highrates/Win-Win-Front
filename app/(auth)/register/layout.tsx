import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Регистрация — Win-Win',
  description: 'Регистрация по телефону или по email с подтверждением кода',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
