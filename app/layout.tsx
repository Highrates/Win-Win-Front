import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteTransitionProvider } from '@/components/SiteTransition';
import { ClientOnlyOverlays } from '@/components/ClientOnlyOverlays';
import { SITE_FAVICON_SRC, SITE_NAME, SITE_WEBCLIP_SRC } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Каталог мебели для дизайнеров`,
  description: 'Качественный и стильный интерьер из Китая',
  icons: {
    icon: [{ url: SITE_FAVICON_SRC, type: 'image/svg+xml' }],
    apple: [{ url: SITE_WEBCLIP_SRC, sizes: '256x256', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
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
