/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the built demo works when served from a GitHub Pages
  // project subpath (https://<user>.github.io/organization-hierarchy/).
  base: './',
  plugins: [react()],
  test: {
    globals: true, // dibutuhkan auto-cleanup @testing-library/react
    environment: 'node', // logic tests (buildTree dkk) bebas DOM — bukti NFR-6
    include: ['src/**/*.test.{ts,tsx}'],
    // Component tests (interaksi) butuh DOM
    environmentMatchGlobs: [['src/**/*.test.tsx', 'jsdom']],
    setupFiles: ['src/test/setup.ts'],
  },
});
