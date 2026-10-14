import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

test('compiled API handlers load in plain Node and bind an encrypted session', () => {
  const output = mkdtempSync(resolve('.api-runtime-'));
  const entries = readdirSync('api', { recursive: true })
    .map(String).filter(path => path.endsWith('.ts')).map(path => join('api', path));
  const compileEntries = [...entries, 'src/core/index.ts'];
  try {
    execFileSync(process.execPath, [
      'node_modules/typescript/bin/tsc', '--target', 'ES2022',
      '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
      '--esModuleInterop', '--skipLibCheck', '--outDir', output, ...compileEntries
    ], { stdio: 'pipe' });
    const apiBase = pathToFileURL(join(output, 'api/')).href;
    const serverBase = pathToFileURL(join(output, 'src/server/')).href;
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    const result = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      const base = ${JSON.stringify(apiBase)};
      await import(${JSON.stringify(serverBase).replace('/src/server/', '/src/core/')} + 'index.js');
      for (const entry of ${JSON.stringify(entries.map(path => path.slice(4).replaceAll('\\', '/').replace(/\.ts$/, '.js')))}) {
        assert.equal(typeof (await import(base + entry)).default, 'function');
      }
      const { default: bind } = await import(base + 'sync/bind.js');
      const response = () => ({
        statusCode: 0, headers: {}, body: '',
        setHeader(key, value) { this.headers[key] = value; },
        end(value = '') { this.body = value; }
      });
      const options = response();
      await bind({ method: 'OPTIONS', headers: {} }, options);
      assert.equal(options.statusCode, 204);
      assert.equal(options.headers['Access-Control-Allow-Origin'], '*');
      delete process.env.UPSTASH_REDIS_REST_URL;
      const missingConfig = response();
      await bind({ method: 'POST', headers: {}, body: {} }, missingConfig);
      assert.equal(missingConfig.statusCode, 503);
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      process.env.SYNC_ENCRYPTION_KEY = '01234567890123456789012345678901';
      const records = new Map();
      globalThis.fetch = async (url, init) => {
        assert.equal(url, 'https://redis.test');
        const [command, key, ...args] = JSON.parse(init.body);
        let result;
        switch (command) {
          case 'EVAL': result = 1; break;
          case 'GET': result = records.get(key) ?? null; break;
          case 'SET': records.set(key, args[0]); result = 'OK'; break;
          case 'HSET': records.set(key + ':' + args[0], args[1]); result = 1; break;
          case 'HGET': result = records.get(key + ':' + args[0]) ?? null; break;
          case 'SADD': case 'EXPIRE': result = 1; break;
          default: throw new Error('Unexpected Redis command: ' + command);
        }
        return Response.json({ result });
      };
      const bound = response();
      const cookie = 'educg_session=test-only';
      await bind({ method: 'POST', headers: {}, body: { cookie } }, bound);
      assert.equal(bound.statusCode, 200, bound.body);
      const { token, feedToken } = JSON.parse(bound.body);
      assert.ok(token.length >= 32 && feedToken.length >= 32);
      assert.ok(!JSON.stringify([...records]).includes(cookie));
      const { getAutoSyncStatus, setAutoSyncEnabled } = await import(${JSON.stringify(serverBase)} + 'auto-sync.js');
      assert.equal((await getAutoSyncStatus(token)).enabled, true);
      await setAutoSyncEnabled(token, false);
      assert.equal((await getAutoSyncStatus(token)).enabled, false);
      await setAutoSyncEnabled(token, true);
      assert.equal((await getAutoSyncStatus(token)).enabled, true);
      const { readCalendarFeed } = await import(${JSON.stringify(serverBase)} + 'calendar.js');
      const calendar = await readCalendarFeed(feedToken);
      assert.match(calendar, /BEGIN:VCALENDAR/);
      assert.match(calendar, /X-WR-CALNAME:课程作业截止/);
      const { default: caldav } = await import(base + 'caldav.js');
      const caldavResponse = response();
      const credentials = Buffer.from('noddl:' + feedToken).toString('base64');
      await caldav({ method: 'GET', url: '/api/caldav', headers: { authorization: 'Basic ' + credentials } }, caldavResponse);
      assert.equal(caldavResponse.statusCode, 200, caldavResponse.body);
      assert.match(caldavResponse.body, /BEGIN:VCALENDAR/);
      console.log('API runtime and encrypted binding passed');
    `], { env, encoding: 'utf8' });
    assert.match(result, /API runtime and encrypted binding passed/);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
