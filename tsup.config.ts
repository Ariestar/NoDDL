import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  onSuccess: 'node scripts/sync-cli.mjs'
});
