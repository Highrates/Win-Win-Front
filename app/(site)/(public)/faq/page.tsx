import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: `FAQ — ${SITE_NAME}`,
  description: 'Частые вопросы о работе Wupapa.',
};

export default function FaqPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>FAQ</h1>
      <p>Страница в разработке.</p>
    </main>
  );
}
