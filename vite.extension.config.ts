import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredApiUrl = env.VITE_API_BASE_URL || '';

  return {
    plugins: [preact(), tailwindcss()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(configuredApiUrl)
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
