/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the built demo works when served from a GitHub Pages
  // project subpath (https://<user>.github.io/organization-hierarchy/).
  base: './',
  plugins: [react()],
  test: {
    globals: true, // needed for @testing-library/react auto-cleanup
    environment: 'node', // logic tests (buildTree etc.) are DOM-free — proof of NFR-6
    include: ['src/**/*.test.{ts,tsx}'],
    // Component tests (interaction) need a DOM
    environmentMatchGlobs: [['src/**/*.test.tsx', 'jsdom']],
    setupFiles: ['src/test/setup.ts'],
    // In CI, also emit a junit.xml alongside the console output — dorny/test-reporter
    // (see .github/workflows/ci.yml) turns it into per-test PR annotations. Baked in
    // here (rather than passed as CLI flags through `pnpm test:coverage -- ...`) so it
    // behaves identically whether vitest is invoked directly or through a script/pnpm.
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: process.env.CI ? { junit: './junit.xml' } : undefined,
    coverage: {
      provider: 'v8',
      // 'json-summary' feeds the vitest-coverage-report-action PR comment in CI.
      reporter: ['text', 'json-summary', 'json'],
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: ['src/lib/**/*.stories.*', 'src/lib/**/*.test.*', 'src/lib/index.ts'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
