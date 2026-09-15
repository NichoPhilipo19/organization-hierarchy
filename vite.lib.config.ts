import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Library build: `npm run build:lib` → dist-lib/
export default defineConfig({
  plugins: [
    react(),
    // T-1: generate .d.ts matching the `types` field in package.json
    dts({
      include: ['src/lib'],
      entryRoot: 'src/lib',
      exclude: ['src/lib/**/*.test.*', 'src/lib/**/*.stories.*'],
    }),
  ],
  build: {
    outDir: 'dist-lib',
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'OrgHierarchyTree',
      formats: ['es', 'cjs'],
      // es -> index.js, cjs -> index.cjs (dual package, see package.json "exports")
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // Rollup strips 'use client' during bundling — restored via the banner
        // so Next.js App Router still recognizes OrgChart as a Client Component.
        banner: "'use client';\n",
      },
    },
  },
});
