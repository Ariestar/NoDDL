import { randomBytes } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

const executable = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npx';
const prefix = process.platform === 'win32' ? ['/d', '/s', '/c', 'npx'] : [];
const wranglerArgs = args => [...prefix, 'wrangler', ...args];
const run = args => execFileSync(executable, wranglerArgs(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
const secrets = JSON.parse(run(['secret', 'list', '--format', 'json']));

if (secrets.some(secret => secret.name === 'SYNC_ENCRYPTION_KEY')) {
  console.log('SYNC_ENCRYPTION_KEY already exists');
  process.exit(0);
}

const key = randomBytes(48).toString('base64url');
const result = spawnSync(executable, wranglerArgs(['secret', 'put', 'SYNC_ENCRYPTION_KEY']), {
  input: `${key}\n`,
  encoding: 'utf8',
  stdio: ['pipe', 'inherit', 'inherit']
});

if (result.status !== 0) process.exit(result.status ?? 1);
console.log('Generated SYNC_ENCRYPTION_KEY');
