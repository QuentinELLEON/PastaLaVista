import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Les variables VITE_* sont lues depuis le .env à la racine du dépôt
export default defineConfig({
  plugins: [react()],
  envDir: '../..',
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}', 'test-e2e/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    // Les feuilles de style sont lues telles quelles (test des contrastes des tokens)
    css: { include: [/tokens\.css/] },
  },
});
