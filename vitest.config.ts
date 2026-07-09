import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [['**/*.test.tsx', 'jsdom']],
    include: [
      'lib/**/*.test.ts',
      'lib/**/*.test.tsx',
      'components/**/*.test.ts',
      'app/**/*.test.tsx',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
