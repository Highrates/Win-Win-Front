/** @type {import('next').NextConfig} */
/**
 * Dev: `npm run dev` / `dev:turbo`. Секцию `webpack` не добавляем — при Turbopack Next ругается.
 * Битые чанки HMR (webpack): `npm run dev:clean:webpack`.
 *
 * Safari + webpack HMR: сообщение «access control checks» на `*.hot-update.json` часто ложное для dev;
 * попробуйте `npm run dev:turbo` или Chrome. Явный `allowedDevOrigins` в Next включает строгий block-режим — не добавляем без необходимости.
 */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/images/favicon.svg' }];
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
