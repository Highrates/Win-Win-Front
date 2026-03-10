import type { Metadata } from 'next';
import './globals.css';
import { HeaderWrapper } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SiteTransitionProvider } from '@/components/SiteTransition';
import { ClientOnlyOverlays } from '@/components/ClientOnlyOverlays';

export const metadata: Metadata = {
  title: 'Win-Win — Каталог мебели для дизайнеров',
  description: 'Большой каталог мебели для дизайнеров интерьеров',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <SiteTransitionProvider>
          <ClientOnlyOverlays />
          <HeaderWrapper />
          {children}
          <Footer />
        </SiteTransitionProvider>
      </body>
    </html>
  );
}
