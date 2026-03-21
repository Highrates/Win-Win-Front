/** @type {import('next').NextConfig} */
/**
 * Dev по умолчанию: `next dev --turbo` (package.json). Секцию `webpack` не добавляем:
 * при Turbopack Next предупреждает «Webpack is configured while Turbopack is not».
 * Если запускаете `npm run dev:webpack` и ловите битые чанки HMR — `npm run dev:clean:webpack`.
 */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  },
};

module.exports = nextConfig;
