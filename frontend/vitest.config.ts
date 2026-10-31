import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@app': path.resolve(import.meta.dirname, 'src/app'),
      '@content': path.resolve(import.meta.dirname, 'src/content'),
      '@features': path.resolve(import.meta.dirname, 'src/features'),
      '@infrastructure': path.resolve(import.meta.dirname, 'src/infrastructure'),
      '@shared': path.resolve(import.meta.dirname, 'src/shared'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/components/games/**'],
    testTimeout: 30_000,
    restoreMocks: true,
    clearMocks: true,
  },
});
