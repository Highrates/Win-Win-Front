import type { Metadata } from 'next';
import './globals.css';
import { SiteTransitionProvider } from '@/components/SiteTransition';
import { ClientOnlyOverlays } from '@/components/ClientOnlyOverlays';

export const metadata: Metadata = {
  title: '588est — Каталог мебели для дизайнеров',
  description: 'Качественный и стильный интерьер из Китая',
  icons: {
    icon: [{ url: '/images/favicon.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {/* Первый кадр до гидратации: без этого видна разметка страницы до клиентского SiteLoader */}
        <div id="site-boot-loader" className="site-boot-loader" aria-hidden />
        <SiteTransitionProvider>
          <ClientOnlyOverlays />
          {children}
        </SiteTransitionProvider>
      </body>
    </html>
  );
}
