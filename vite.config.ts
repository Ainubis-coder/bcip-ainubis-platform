import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
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
    build: {
      outDir: 'dist',
    },
    server: isBuild
      ? undefined
      : {
          // Disable HMR WebSockets in Cloud Run runtime unless explicitly requested
          hmr: process.env.ENABLE_HMR === 'true',
          watch: process.env.DISABLE_HMR === 'true' ? null : {},
        },
  };
});
