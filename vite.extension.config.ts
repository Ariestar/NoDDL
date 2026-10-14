import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const configuredApiUrl = env.VITE_EMAIL_API_BASE_URL || (vercelUrl ? `https://${vercelUrl}` : '');

  return {
    plugins: [preact(), tailwindcss()],
    define: {
      'import.meta.env.VITE_EMAIL_API_BASE_URL': JSON.stringify(configuredApiUrl)
    },
    build: {
      outDir: 'extension',
      emptyOutDir: false,
      assetsInlineLimit: 10_000_000,
      rollupOptions: {
        input: 'src/extension/index.ts',
        output: {
          format: 'iife',
          entryFileNames: 'nodd-extension.js',
          inlineDynamicImports: true
        }
      }
    }
  };
});
