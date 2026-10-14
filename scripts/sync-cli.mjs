import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('dist/cli.cjs');
const dest = path.resolve('cli.cjs');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
}
