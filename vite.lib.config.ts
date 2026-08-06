import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

// Library build: `npm run build:lib` → dist-lib/
export default defineConfig({
  plugins: [
    react(),
    // T-1: hasilkan .d.ts sesuai field `types` di package.json
    dts({
      include: ['src/lib'],
      entryRoot: 'src/lib',
      exclude: ['src/lib/**/*.test.*'],
    }),
  ],
  build: {
    outDir: 'dist-lib',
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'OrgHierarchyTree',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
});
