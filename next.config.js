/** @type {import('next').NextConfig} */
/**
 * Dev: `npm run dev` / `dev:turbo`. Секцию `webpack` не добавляем — при Turbopack Next ругается.
 * Битые чанки HMR (webpack): `npm run dev:clean:webpack`.
 *
 * Safari + webpack HMR: сообщение «access control checks» на `*.hot-update.json` часто ложное для dev;
 * попробуйте `npm run dev:turbo` или Chrome. Явный `allowedDevOrigins` в Next включает строгий block-режим — не добавляем без необходимости.
 */
function backendOriginForUploads() {
  const raw = (
    process.env.API_URL ||
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3001/api/v1'
  ).trim();
  try {
    return new URL(raw.replace(/\/+$/, '')).origin;
  } catch {
    return 'http://127.0.0.1:3001';
  }
}

const uploadBackendOrigin = backendOriginForUploads();

const nextConfig = {
  reactStrictMode: true,
  /** Локальные workspace-пакеты (file:../packages/*) — иначе re-export в lib/ ломает статический анализ. */
  transpilePackages: ['@win-win/order-status', '@win-win/order-item-snapshot'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    return [
      { source: '/favicon.ico', destination: '/images/favicon.svg' },
      /** Локальные файлы API: браузер грузит с origin Next, не с 127.0.0.1:3001 */
      {
        source: '/uploads/:path*',
        destination: `${uploadBackendOrigin}/uploads/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/categories', destination: '/catalog', permanent: true },
      { source: '/categories/:slug', destination: '/catalog/:slug', permanent: true },
    ];
  },
  /**
   * Лимит тела для Server Actions (не для Route Handlers).
   * Multipart через прокси `app/api/admin/backend` — потоком, без `formData()` (см. route.ts).
   */
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  },
};

module.exports = nextConfig;
