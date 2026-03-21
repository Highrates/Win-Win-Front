import type { Metadata } from 'next';
import './globals.css';
import { SiteChrome } from '@/components/SiteChrome/SiteChrome';
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
          <SiteChrome>{children}</SiteChrome>
        </SiteTransitionProvider>
      </body>
    </html>
  );
}
