import { execFileSync } from 'node:child_process';
import { mkdtempSync, copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repository = 'Ariestar/NoDDL';
const releaseUrl = `https://github.com/${repository}/releases/latest/download/NoDDL-worker-latest.tar.gz`;

const command = (name, args, cwd) => execFileSync(name, args, { cwd, stdio: 'inherit' });

const root = mkdtempSync(join(tmpdir(), 'noddl-release-'));
const archive = join(root, 'NoDDL-worker-latest.tar.gz');
const workerRoot = join(root, 'worker');
mkdirSync(workerRoot);
const archiveResponse = await fetch(releaseUrl, { headers: { Accept: 'application/octet-stream', 'User-Agent': 'NoDDL-release-deployer' } });
if (!archiveResponse.ok) throw new Error(`下载 NoDDL Worker 包失败: HTTP ${archiveResponse.status}`);
writeFileSync(archive, Buffer.from(await archiveResponse.arrayBuffer()));
command('tar', ['-xzf', archive, '-C', workerRoot]);
copyFileSync(resolve('wrangler.toml'), join(workerRoot, 'wrangler.toml'));

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
command(pnpm, ['install', '--frozen-lockfile', '--ignore-scripts', '--prod'], workerRoot);
command(npx, ['--yes', 'wrangler', 'deploy'], workerRoot);
command('node', ['scripts/ensure-sync-key.mjs'], workerRoot);
command(npx, ['--yes', 'wrangler', 'd1', 'migrations', 'apply', 'DB', '--remote'], workerRoot);
console.log('已部署最新 NoDDL Worker');
