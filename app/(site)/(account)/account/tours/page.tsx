import type { Metadata } from 'next';
import { AccountToursPageClient } from './AccountToursPageClient';

export const metadata: Metadata = {
  title: 'Туры в Китай',
};

export default function AccountToursPage() {
  return <AccountToursPageClient />;
}
