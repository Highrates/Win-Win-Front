const path = require('path');

/** @type {import('next').NextConfig} */
/**
 * Dev: `npm run dev` / `dev:turbo`. Секцию `webpack` не добавляем — при Turbopack Next ругается.
 * Битые чанки HMR (webpack): `npm run dev:clean:webpack`.
 *
 * Safari + webpack HMR: сообщение «access control checks» на `*.hot-update.json` часто ложное для dev;
 * попробуйте `npm run dev:turbo` или Chrome. Явный `allowedDevOrigins` в Next включает строгий block-режим — не добавляем без необходимости.
 *
 * Collecting build traces: NFT не должен уходить выше корня приложения (иначе на VPS
 * «зависает» на минуты/часы, особенно при symlink в чужой node_modules).
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
  transpilePackages: ['@win-win/order-status', '@win-win/order-item-snapshot', '@win-win/sourcing-request'],
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
      { source: '/favicon.ico', destination: '/images/favicon.wupapa.svg' },
      { source: '/apple-touch-icon.png', destination: '/images/webclip.png' },
      { source: '/apple-touch-icon-precomposed.png', destination: '/images/webclip.png' },
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
    /** Корень трассировки = этот пакет (на сервере /var/www/win-win-front). */
    outputFileTracingRoot: path.join(__dirname),
    /** Dev/test-only и тяжёлые пакеты не нужны в server trace → меньше риск hang NFT. */
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@types/**/*',
        'node_modules/typescript/**/*',
        'node_modules/eslint*/**/*',
        'node_modules/@typescript-eslint/**/*',
        'node_modules/vitest/**/*',
        'node_modules/@vitest/**/*',
        'node_modules/playwright/**/*',
        'node_modules/@playwright/**/*',
        'node_modules/sass/**/*',
        '**/*.md',
        '**/*.map',
      ],
    },
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  },
};

module.exports = nextConfig;
