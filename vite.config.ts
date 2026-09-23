import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
        '@bcip/ui': path.resolve(rootDir, 'packages/ui/src/index.ts'),
        '@bcip/database': path.resolve(rootDir, 'packages/database/src/index.ts'),
        '@bcip/auth': path.resolve(rootDir, 'packages/auth/src/index.ts'),
        '@bcip/ai': path.resolve(rootDir, 'packages/ai/src/index.ts'),
        '@bcip/integrations': path.resolve(rootDir, 'packages/integrations/src/index.ts'),
        '@bcip/workflows': path.resolve(rootDir, 'packages/workflows/src/index.ts'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
