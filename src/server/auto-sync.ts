import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { CourseGradingClient } from '../core/client.js';
import { FetchHttpClient } from '../core/http.js';
import { PLATFORM_SESSION_COOKIE } from '../core/constants.js';
import type { Assignment } from '../core/types.js';
import { publishCalendarFeed } from './calendar.js';
import { redisCommand } from './redis.js';

const ACCOUNT_INDEX_KEY = 'auto-sync:accounts';
const ACCOUNT_TTL_SECONDS = 90 * 24 * 60 * 60;
const ACCOUNT_KEY_PREFIX = 'auto-sync:account:';

interface StoredAccount {
  cookie: string;
  feedToken: string;
  updatedAt: number;
  lastSyncAt?: number;
  lastError?: string;
  assignments?: Assignment[];
}

export class AutoSyncError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function secretKey(): Buffer {
  const secret = process.env.SYNC_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw new Error('SYNC_ENCRYPTION_KEY must contain at least 32 characters');
  return createHash('sha256').update(secret).digest();
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function accountKey(token: string): string {
  return `${ACCOUNT_KEY_PREFIX}${digest(token)}`;
}

function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64url')).join('.');
}

function decrypt(value: string): string {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Stored session is invalid');
  const decipher = createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

function validateCookie(value: unknown): string {
  if (typeof value !== 'string') throw new AutoSyncError(400, '课程登录会话无效');
  const cookie = value.trim();
  const sessionCookiePattern = new RegExp(`(?:^|;\\s*)${PLATFORM_SESSION_COOKIE}=[^;]+`);
  if (cookie.length > 4096 || /[\r\n]/.test(cookie) || !sessionCookiePattern.test(cookie)) {
    throw new AutoSyncError(400, '课程登录会话无效');
  }
  return cookie;
}

async function readAccount(token: string): Promise<StoredAccount> {
  if (!token || token.length < 32) throw new AutoSyncError(401, '自动同步尚未绑定');
  const raw = await redisCommand(['GET', accountKey(token)]);
  if (typeof raw !== 'string') throw new AutoSyncError(401, '自动同步已失效，请重新绑定');
  const account = JSON.parse(raw) as StoredAccount;
  if (!account.cookie || !account.feedToken) throw new Error('Stored auto-sync account is invalid');
  return account;
}

async function writeAccount(token: string, account: StoredAccount): Promise<void> {
  await redisCommand(['SET', accountKey(token), JSON.stringify(account), 'EX', ACCOUNT_TTL_SECONDS]);
  await redisCommand(['SADD', ACCOUNT_INDEX_KEY, digest(token)]);
}

export async function bindAutoSync(input: Record<string, unknown>, clientIp: string): Promise<{ token: string; feedToken: string }> {
  const cookie = validateCookie(input.cookie);
  const existingToken = typeof input.token === 'string' ? input.token : '';
  const token = existingToken || randomBytes(32).toString('base64url');
  if (existingToken) await readAccount(existingToken);

  const published = await publishCalendarFeed(clientIp, { assignments: [], feedToken: input.feedToken });
  await writeAccount(token, {
    cookie: encrypt(cookie),
    feedToken: published.feedToken,
    updatedAt: Date.now(),
    assignments: []
  });
  return { token, feedToken: published.feedToken };
}

export async function getAutoSyncStatus(token: string): Promise<{
  enabled: boolean;
  feedToken: string;
  updatedAt: number;
  lastSyncAt?: number;
  lastError?: string;
  assignments: number;
}> {
  const account = await readAccount(token);
  return {
    enabled: true,
    feedToken: account.feedToken,
    updatedAt: account.updatedAt,
    lastSyncAt: account.lastSyncAt,
    lastError: account.lastError,
    assignments: account.assignments?.length || 0
  };
}

export async function getAutoSyncAssignments(token: string): Promise<Assignment[]> {
  const account = await readAccount(token);
  return account.assignments || [];
}

export async function syncAllAutoAccounts(): Promise<{ total: number; succeeded: number; failed: number }> {
  const raw = await redisCommand(['SMEMBERS', ACCOUNT_INDEX_KEY]);
  const ids = Array.isArray(raw) ? raw.filter((value): value is string => typeof value === 'string') : [];
  let succeeded = 0;
  let failed = 0;

  for (const id of ids) {
    const rawToken = await redisCommand(['GET', `${ACCOUNT_KEY_PREFIX}${id}`]);
    if (typeof rawToken !== 'string') {
      await redisCommand(['SREM', ACCOUNT_INDEX_KEY, id]);
      continue;
    }
    try {
      await syncAutoAccountTokenDigest(id, rawToken);
      succeeded += 1;
    } catch (error) {
      failed += 1;
      console.error('Auto-sync account failed', id, error);
      const account = JSON.parse(rawToken) as StoredAccount;
      await redisCommand(['SET', `${ACCOUNT_KEY_PREFIX}${id}`, JSON.stringify({
        ...account,
        updatedAt: Date.now(),
        lastError: error instanceof Error ? error.message : String(error)
      }), 'EX', ACCOUNT_TTL_SECONDS]);
    }
  }

  return { total: succeeded + failed, succeeded, failed };
}

async function syncAutoAccountTokenDigest(id: string, raw: string): Promise<void> {
  const account = JSON.parse(raw) as StoredAccount;
  const cookie = decrypt(account.cookie);
  const client = new CourseGradingClient({ sessionCookie: cookie }, new FetchHttpClient());
  const assignments = await client.safeSyncAllCourses();
  const published = await publishCalendarFeed(`auto-sync:${id}`, {
    assignments,
    feedToken: account.feedToken
  });
  await redisCommand(['SET', `${ACCOUNT_KEY_PREFIX}${id}`, JSON.stringify({
    ...account,
    feedToken: published.feedToken,
    updatedAt: Date.now(),
    lastSyncAt: Date.now(),
    lastError: undefined,
    assignments
  }), 'EX', ACCOUNT_TTL_SECONDS]);
}
