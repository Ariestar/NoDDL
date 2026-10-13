import test from 'node:test';
import assert from 'node:assert/strict';
import { getServiceConfig, normalizeApiBaseUrl } from '../src/userscript/email-api';
import type { StorageAdapter } from '../src/core/types';

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, string>();

  async get(key: string) {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string) {
    this.values.set(key, value);
  }

  async remove(key: string) {
    this.values.delete(key);
  }
}

test('service URLs accept only HTTPS roots', () => {
  assert.equal(normalizeApiBaseUrl('https://student.vercel.app///'), 'https://student.vercel.app');
  assert.equal(normalizeApiBaseUrl('https://student.vercel.app/api'), '');
  assert.equal(normalizeApiBaseUrl('http://student.vercel.app'), '');
  assert.equal(normalizeApiBaseUrl('https://user:password@student.vercel.app'), '');
});

test('custom service credentials use an isolated storage namespace', async () => {
  const storage = new MemoryStorage();
  await storage.set('nodd_api_base_url', 'https://student.vercel.app');
  const service = await getServiceConfig(storage);

  await service.storage.set('nodd_calendar_feed_token', 'custom-token');

  assert.equal(await service.storage.get('nodd_calendar_feed_token'), 'custom-token');
  assert.equal(await storage.get('nodd_calendar_feed_token'), null);
});
