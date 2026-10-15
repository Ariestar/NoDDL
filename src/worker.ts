import { CourseGradingClient } from './core/client.js';
import { FetchHttpClient } from './core/http.js';
import { createDeadlineCalendar } from './core/calendar.js';
import { PLATFORM_SESSION_COOKIE } from './core/constants.js';
import type { Assignment } from './core/types.js';

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  DB: D1Database;
  SYNC_ENCRYPTION_KEY: string;
  EMAIL_CODE_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  CRON_SECRET?: string;
}

interface StoredAccount {
  token: string;
  cookie: string;
  feedToken: string;
  enabled: boolean;
  updatedAt: number;
  lastSyncAt?: number;
  lastError?: string;
  assignments: Assignment[];
}

const encoder = new TextEncoder();
const FEED_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
const EMAIL_BINDING_TTL_MS = FEED_TTL_MS;
const PLATFORM_ORIGIN = 'http://115.156.107.145';

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(), ...headers }
  });
}

function cors(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function errorStatus(error: unknown): number {
  return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : 500;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function base64url(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(normalized);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function digest(value: string): Promise<string> {
  return [...await sha256(value)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

async function encryptionKey(secret: string): Promise<CryptoKey> {
  if (!secret || secret.length < 32) throw new Error('SYNC_ENCRYPTION_KEY must contain at least 32 characters');
  return crypto.subtle.importKey('raw', await sha256(secret) as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encrypt(value: string, secret: string): Promise<string> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(secret), encoder.encode(value)));
  return `${base64url(iv)}.${base64url(encrypted)}`;
}

async function decrypt(value: string, secret: string): Promise<string> {
  const [ivValue, encryptedValue] = value.split('.');
  if (!ivValue || !encryptedValue) throw new Error('Stored session is invalid');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64url(ivValue) as BufferSource }, await encryptionKey(secret), fromBase64url(encryptedValue) as BufferSource);
  return new TextDecoder().decode(plain);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assignments(value: unknown): Assignment[] {
  if (!Array.isArray(value)) throw new Error('作业数据无效');
  return value.map(item => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.courseName !== 'string' || typeof item.title !== 'string' || typeof item.url !== 'string') {
      throw new Error('作业数据缺少必要字段');
    }
    if (typeof item.deadlineTimestamp !== 'number' || !Number.isFinite(item.deadlineTimestamp)) throw new Error('作业截止时间无效');
    return item as unknown as Assignment;
  });
}

function feedToken(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{32,}$/.test(value)) return randomToken();
  return value;
}

async function readFeed(env: Env, token: string): Promise<Assignment[]> {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(token)) throw new Error('日历 Feed Token 无效');
  const row = await env.DB.prepare('SELECT assignments, expires_at FROM feeds WHERE token = ?').bind(token).first<{ assignments: string; expires_at: number }>();
  if (!row || row.expires_at <= Date.now()) throw new Error('日历 Feed 不存在或已过期');
  return assignments(JSON.parse(row.assignments));
}

async function publishFeed(env: Env, tokenInput: unknown, value: unknown): Promise<{ feedToken: string; assignments: number }> {
  const list = assignments(value);
  const token = feedToken(tokenInput);
  await env.DB.prepare(`INSERT INTO feeds(token, assignments, expires_at) VALUES (?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET assignments = excluded.assignments, expires_at = excluded.expires_at`)
    .bind(token, JSON.stringify(list), Date.now() + FEED_TTL_MS).run();
  return { feedToken: token, assignments: list.length };
}

function calendarText(list: Assignment[]): string {
  return createDeadlineCalendar(list, PLATFORM_ORIGIN);
}

async function readAccount(env: Env, token: string): Promise<StoredAccount> {
  if (!token || token.length < 32) throw Object.assign(new Error('自动同步尚未绑定'), { status: 401 });
  const row = await env.DB.prepare('SELECT * FROM accounts WHERE token = ?').bind(token).first<Record<string, unknown>>();
  if (!row) throw Object.assign(new Error('自动同步已失效，请重新绑定'), { status: 401 });
  return {
    token,
    cookie: String(row.cookie),
    feedToken: String(row.feed_token),
    enabled: Number(row.enabled) !== 0,
    updatedAt: Number(row.updated_at),
    lastSyncAt: row.last_sync_at == null ? undefined : Number(row.last_sync_at),
    lastError: typeof row.last_error === 'string' ? row.last_error : undefined,
    assignments: assignments(JSON.parse(String(row.assignments)))
  };
}

async function saveAccount(env: Env, value: StoredAccount): Promise<void> {
  await env.DB.prepare(`INSERT INTO accounts(token, cookie, feed_token, enabled, updated_at, last_sync_at, last_error, assignments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET cookie = excluded.cookie, feed_token = excluded.feed_token,
      enabled = excluded.enabled, updated_at = excluded.updated_at, last_sync_at = excluded.last_sync_at,
      last_error = excluded.last_error, assignments = excluded.assignments`)
    .bind(value.token, value.cookie, value.feedToken, value.enabled ? 1 : 0, value.updatedAt, value.lastSyncAt ?? null, value.lastError ?? null, JSON.stringify(value.assignments)).run();
}

function bearer(request: Request): string {
  const value = request.headers.get('Authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

function basicPassword(request: Request): string {
  const value = request.headers.get('Authorization') || '';
  if (!value.startsWith('Basic ')) return '';
  try {
    const decoded = atob(value.slice(6));
    return decoded.slice(decoded.indexOf(':') + 1);
  } catch {
    return '';
  }
}

function challenge(): Response {
  return new Response('CalDAV credentials required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Course Calendar"' } });
}

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function eventParts(calendar: string): string[] {
  return [...calendar.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)].map(match => match[0]);
}

function singleEvent(calendar: string, event: string): string {
  const start = calendar.indexOf('BEGIN:VCALENDAR');
  const first = calendar.indexOf('BEGIN:VEVENT');
  return `${first >= 0 ? calendar.slice(start, first) : calendar.slice(start)}${event}\r\nEND:VCALENDAR\r\n`;
}

function eventIndex(pathname: string): number | null {
  const match = pathname.match(/\/event\/(\d+)\.ics$/);
  return match ? Number(match[1]) : null;
}

function requestedIndexes(body: string): number[] | null {
  if (!body.includes('calendar-multiget')) return null;
  const indexes = [...body.matchAll(/\/event\/(\d+)\.ics/g)].map(match => Number(match[1]));
  return indexes.length ? [...new Set(indexes)] : null;
}

async function caldav(request: Request, env: Env): Promise<Response> {
  const token = basicPassword(request);
  if (request.method === 'OPTIONS') {
    return token ? new Response(null, { status: 200, headers: { DAV: '1, 2, calendar-access', Allow: 'OPTIONS, PROPFIND, REPORT, GET, HEAD' } }) : challenge();
  }
  if (!token) return challenge();
  const list = await readFeed(env, token);
  const calendar = calendarText(list);
  const tag = await digest(calendar);
  const url = new URL(request.url);
  const index = eventIndex(url.pathname);
  const events = eventParts(calendar);
  if (index !== null && (!Number.isInteger(index) || !events[index])) return new Response('Calendar event not found', { status: 404 });
  if (request.method === 'GET' || request.method === 'HEAD') {
    const body = index === null ? calendar : singleEvent(calendar, events[index]);
    return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers: { 'Content-Type': 'text/calendar; charset=utf-8', ETag: `"${tag}${index === null ? '' : `-${index}`}"` } });
  }
  if (request.method !== 'PROPFIND' && request.method !== 'REPORT') return new Response('Method not allowed', { status: 405 });
  const base = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  const body = request.method === 'REPORT' ? await request.text() : '';
  const selected = requestedIndexes(body) || events.map((_, itemIndex) => itemIndex);
  const children = selected.filter(itemIndex => events[itemIndex]).map(itemIndex => {
    const eventCalendar = singleEvent(calendar, events[itemIndex]);
    return `<D:response><D:href>${xml(`${base}event/${itemIndex}.ics`)}</D:href><D:propstat><D:prop><D:getetag>&quot;${tag}-${itemIndex}&quot;</D:getetag><D:getcontenttype>text/calendar; component=&quot;VEVENT&quot;</D:getcontenttype><C:calendar-data>${xml(eventCalendar)}</C:calendar-data></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
  }).join('');
  const collection = request.method === 'PROPFIND'
    ? `<D:response><D:href>${xml(base)}</D:href><D:propstat><D:prop><D:displayname>课程作业截止</D:displayname><D:resourcetype><D:collection/><C:calendar/></D:resourcetype><D:getetag>&quot;${tag}&quot;</D:getetag><CS:getctag>${tag}</CS:getctag><C:supported-calendar-component-set><C:comp name="VEVENT"/></C:supported-calendar-component-set><C:supported-calendar-data><C:calendar-data content-type="text/calendar" version="2.0"/></C:supported-calendar-data></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`
    : '';
  return new Response(`<?xml version="1.0" encoding="utf-8" ?><D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/">${collection}${children}</D:multistatus>`, { status: 207, headers: { 'Content-Type': 'application/xml; charset=utf-8', DAV: '1, 2, calendar-access' } });
}

async function sendEmail(env: Env, to: string, subject: string, text: string): Promise<void> {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.RESEND_FROM || 'NoDDL <onboarding@resend.dev>', to: [to], subject, text })
  });
  if (!response.ok) throw new Error(`Resend API send failed (${response.status})`);
}

async function rateLimit(env: Env, key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT count, expires_at FROM rate_limits WHERE key = ?').bind(key).first<{ count: number; expires_at: number }>();
  if (!row || row.expires_at <= now) {
    await env.DB.prepare('INSERT INTO rate_limits(key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, expires_at = excluded.expires_at').bind(key, now + windowMs).run();
    return true;
  }
  if (row.count >= limit) return false;
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
}

async function emailRoute(request: Request, env: Env, path: string): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const payload = await request.json() as Record<string, unknown>;
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) return json({ error: '请输入有效邮箱' }, 400);
  const emailHash = await digest(email);
  const emailCodeSecret = env.EMAIL_CODE_SECRET;
  if ((path === 'request-code' || path === 'verify-code') && (!emailCodeSecret || emailCodeSecret.length < 32)) {
    throw new Error('EMAIL_CODE_SECRET is not configured');
  }
  if (path === 'request-code') {
    if (!(await rateLimit(env, `email-code:${emailHash}`, 3, 24 * 60 * 60 * 1000))) return json({ error: '请求过于频繁，请稍后再试' }, 429);
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const code = String(100000 + (random[0] % 900000));
    const codeDigest = await hmac(emailCodeSecret!, `${email}:${code}`);
    await env.DB.prepare(`INSERT INTO email_codes(email_hash, digest, expires_at, attempts) VALUES (?, ?, ?, 0)
      ON CONFLICT(email_hash) DO UPDATE SET digest = excluded.digest, expires_at = excluded.expires_at, attempts = 0`).bind(emailHash, codeDigest, Date.now() + EMAIL_CODE_TTL_MS).run();
    await sendEmail(env, email, 'NoDDL 邮箱验证码', `你的验证码是 ${code}，10 分钟内有效。若非本人操作，请忽略此邮件。`);
    return json({ sent: true });
  }
  if (path === 'verify-code') {
    const code = typeof payload.code === 'string' ? payload.code : '';
    const row = await env.DB.prepare('SELECT digest, expires_at, attempts FROM email_codes WHERE email_hash = ?').bind(emailHash).first<{ digest: string; expires_at: number; attempts: number }>();
    if (!row || row.expires_at <= Date.now() || row.attempts >= 5) return json({ error: '验证码无效或已过期' }, 400);
    await env.DB.prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE email_hash = ?').bind(emailHash).run();
    if (await hmac(emailCodeSecret!, `${email}:${code}`) !== row.digest) return json({ error: '验证码无效或已过期' }, 400);
    const token = randomToken();
    await env.DB.prepare('DELETE FROM email_codes WHERE email_hash = ?').bind(emailHash).run();
    await env.DB.prepare('INSERT INTO email_bindings(token_hash, email, expires_at) VALUES (?, ?, ?)').bind(await digest(token), email, Date.now() + EMAIL_BINDING_TTL_MS).run();
    return json({ email, token });
  }
  const token = bearer(request);
  const binding = await env.DB.prepare('SELECT email FROM email_bindings WHERE token_hash = ? AND expires_at > ?').bind(await digest(token), Date.now()).first<{ email: string }>();
  if (!binding) return json({ error: '邮箱绑定已失效，请重新验证' }, 401);
  if (path === 'unbind') {
    await env.DB.prepare('DELETE FROM email_bindings WHERE token_hash = ?').bind(await digest(token)).run();
    return json({ removed: true });
  }
  if (path === 'alert') {
    const test = payload.test === true;
    const list = test ? [] : assignments(payload.assignments);
    const body = test ? 'NoDDL 邮件提醒配置成功。' : list.map(item => `${item.courseName} - ${item.title}\n截止：${item.deadline}（${item.remainingText}）`).join('\n\n');
    await sendEmail(env, binding.email, test ? 'NoDDL 邮件提醒测试' : `NoDDL 提醒：${list.length} 项作业即将截止`, body);
    return json({ sent: true });
  }
  return json({ error: 'Not found' }, 404);
}

async function syncAccount(env: Env, row: StoredAccount): Promise<void> {
  const client = new CourseGradingClient({ sessionCookie: await decrypt(row.cookie, env.SYNC_ENCRYPTION_KEY) }, new FetchHttpClient());
  const list = await client.safeSyncAllCourses();
  await publishFeed(env, row.feedToken, list);
  await saveAccount(env, { ...row, assignments: list, updatedAt: Date.now(), lastSyncAt: Date.now(), lastError: undefined });
}

async function syncAll(env: Env): Promise<{ total: number; succeeded: number; failed: number }> {
  const rows = await env.DB.prepare('SELECT * FROM accounts WHERE enabled = 1').all<Record<string, unknown>>();
  let succeeded = 0;
  for (const row of rows.results) {
    const current = await readAccount(env, String(row.token));
    try {
      await syncAccount(env, current);
      succeeded += 1;
    } catch (error) {
      await saveAccount(env, { ...current, updatedAt: Date.now(), lastError: message(error) });
    }
  }
  return { total: rows.results.length, succeeded, failed: rows.results.length - succeeded };
}

async function api(request: Request, env: Env, path: string): Promise<Response> {
  if (path === '/api/health' && request.method === 'GET') return json({ ok: true });
  if (path === '/api/calendar/feed' && request.method === 'GET') {
    const token = new URL(request.url).searchParams.get('token') || '';
    return new Response(calendarText(await readFeed(env, token)), { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-cache' } });
  }
  if (path === '/api/calendar/publish' && request.method === 'POST') {
    const body = await request.json() as Record<string, unknown>;
    return json(await publishFeed(env, body.feedToken, body.assignments));
  }
  if (path === '/api/sync/bind' && request.method === 'POST') {
    const body = await request.json() as Record<string, unknown>;
    const cookie = typeof body.cookie === 'string' ? body.cookie.trim() : '';
    if (!new RegExp(`(?:^|;\\s*)${PLATFORM_SESSION_COOKIE}=[^;]+`).test(cookie)) return json({ error: '课程登录会话无效' }, 400);
    const token = typeof body.token === 'string' && body.token ? body.token : randomToken();
    if (body.token) await readAccount(env, token);
    const published = await publishFeed(env, body.feedToken, []);
    await saveAccount(env, { token, cookie: await encrypt(cookie, env.SYNC_ENCRYPTION_KEY), feedToken: published.feedToken, enabled: true, updatedAt: Date.now(), assignments: [] });
    return json({ token, feedToken: published.feedToken });
  }
  if (path === '/api/sync/status') {
    const token = bearer(request);
    const current = await readAccount(env, token);
    if (request.method === 'GET') return json({ enabled: current.enabled, feedToken: current.feedToken, assignments: current.assignments.length, updatedAt: current.updatedAt, lastSyncAt: current.lastSyncAt, lastError: current.lastError });
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.enabled !== 'boolean') return json({ error: 'enabled 无效' }, 400);
    await saveAccount(env, { ...current, enabled: body.enabled, updatedAt: Date.now() });
    return json({ enabled: body.enabled });
  }
  if (path === '/api/sync/assignments' && request.method === 'GET') return json({ assignments: (await readAccount(env, bearer(request))).assignments });
  if (path.startsWith('/api/email/')) return emailRoute(request, env, path.slice('/api/email/'.length));
  if (path === '/api/cron/sync' && request.method === 'GET') {
    if (!env.CRON_SECRET || request.headers.get('Authorization') !== `Bearer ${env.CRON_SECRET}`) return new Response('Unauthorized', { status: 401 });
    return json(await syncAll(env));
  }
  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/caldav-server')) return await caldav(request, env);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
      if (url.pathname.startsWith('/api/')) return await api(request, env, url.pathname);
      return new Response('NoDDL Worker', { status: 200 });
    } catch (error) {
      const status = errorStatus(error);
      return json({ error: message(error) }, status);
    }
  },
  async scheduled(_event: unknown, env: Env): Promise<void> {
    await syncAll(env);
  }
};
