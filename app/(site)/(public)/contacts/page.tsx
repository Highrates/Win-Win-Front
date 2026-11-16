import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Контакты — ${SITE_NAME}`,
  description: 'Контакты Wupapa.',
};

export default function ContactsPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Контакты</h1>
      <p>Страница в разработке.</p>
    </main>
  );
}
