import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Регистрация — Wupapa',
  description: 'Регистрация по телефону или по email с подтверждением кода',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
