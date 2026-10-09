import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { allowWithinLimit, redisCommand, releaseRateLimits } from './redis.js';
import { sendEmail } from './resend.js';

const CODE_TTL_SECONDS = 600;
const BINDING_TTL_SECONDS = 90 * 24 * 60 * 60;

export class EmailServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') throw new EmailServiceError(400, '请输入有效邮箱');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) {
    throw new EmailServiceError(400, '请输入有效邮箱');
  }
  return email;
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function codeDigest(email: string, code: string): string {
  const secret = process.env.EMAIL_CODE_SECRET;
  if (!secret || secret.length < 32) throw new Error('EMAIL_CODE_SECRET must contain at least 32 characters');
  return createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
}

export async function requestEmailCode(emailInput: unknown, clientIp: string): Promise<void> {
  const email = normalizeEmail(emailInput);
  const emailKey = digest(email);
  const ipKey = digest(clientIp || 'unknown');
  const today = new Date().toISOString().slice(0, 10);
  const emailLimitKey = `email-code:email:${emailKey}`;
  const ipLimitKey = `email-code:ip:${ipKey}`;
  const globalLimitKey = `email-code:global:${today}`;
  const emailAllowed = await allowWithinLimit(emailLimitKey, 30, 24 * 60 * 60);
  const ipAllowed = await allowWithinLimit(ipLimitKey, 10, 60 * 60);
  const globalAllowed = await allowWithinLimit(globalLimitKey, 100, 24 * 60 * 60);
  if (!emailAllowed || !ipAllowed || !globalAllowed) {
    await releaseRateLimits([emailLimitKey, ipLimitKey, globalLimitKey]);
    throw new EmailServiceError(429, '请求过于频繁，请稍后再试');
  }

  const code = String(randomInt(100000, 1000000));
  const stored = await redisCommand(['SET', `email-code:${emailKey}`, codeDigest(email, code), 'EX', CODE_TTL_SECONDS, 'NX']);
  if (stored !== 'OK') {
    await releaseRateLimits([emailLimitKey, ipLimitKey, globalLimitKey]);
    throw new EmailServiceError(429, '验证码已发送，请稍后再试');
  }

  try {
    await sendEmail(email, 'NoDDL 邮箱验证码', `你的验证码是 ${code}，10 分钟内有效。若非本人操作，请忽略此邮件。`);
  } catch (error) {
    await Promise.all([
      redisCommand(['DEL', `email-code:${emailKey}`]),
      releaseRateLimits([emailLimitKey, ipLimitKey, globalLimitKey])
    ]);
    throw error;
  }
}

export async function verifyEmailCode(emailInput: unknown, codeInput: unknown): Promise<{ email: string; token: string }> {
  const email = normalizeEmail(emailInput);
  if (typeof codeInput !== 'string' || !/^\d{6}$/.test(codeInput)) {
    throw new EmailServiceError(400, '验证码无效或已过期');
  }

  const emailKey = digest(email);
  if (!(await allowWithinLimit(`email-code:attempt:${emailKey}`, 5, CODE_TTL_SECONDS))) {
    throw new EmailServiceError(429, '尝试次数过多，请重新获取验证码');
  }

  const key = `email-code:${emailKey}`;
  const stored = await redisCommand(['GET', key]);
  const expected = codeDigest(email, codeInput);
  if (typeof stored !== 'string' || stored.length !== expected.length || !timingSafeEqual(Buffer.from(stored), Buffer.from(expected))) {
    throw new EmailServiceError(400, '验证码无效或已过期');
  }

  await redisCommand(['DEL', key, `email-code:attempt:${emailKey}`]);
  const token = randomBytes(32).toString('base64url');
  await redisCommand(['SET', `email-binding:${digest(token)}`, email, 'EX', BINDING_TTL_SECONDS]);
  return { email, token };
}

export async function sendEmailAlert(
  token: string,
  payload: { test?: boolean; assignments?: unknown }
): Promise<{ sent: boolean; duplicate?: boolean }> {
  const tokenKey = digest(token);
  const email = await redisCommand(['GET', `email-binding:${tokenKey}`]);
  if (typeof email !== 'string') throw new EmailServiceError(401, '邮箱绑定已失效，请重新验证');

  let subject = 'NoDDL 邮件提醒测试';
  let body = 'NoDDL 邮件提醒配置成功。';
  const reservedKeys: string[] = [];

  if (!payload.test) {
    if (!Array.isArray(payload.assignments) || payload.assignments.length === 0 || payload.assignments.length > 20) {
      throw new EmailServiceError(400, '提醒内容无效');
    }

    const assignments = payload.assignments.map((item) => {
      if (!item || typeof item !== 'object') throw new EmailServiceError(400, '提醒内容无效');
      const value = item as Record<string, unknown>;
      const fields = [value.id, value.courseName, value.title, value.deadline, value.remainingText];
      if (fields.some(field => typeof field !== 'string' || !field || field.length > 200)) {
        throw new EmailServiceError(400, '提醒内容无效');
      }
      if (typeof value.deadlineTimestamp !== 'number' || !Number.isFinite(value.deadlineTimestamp) || value.deadlineTimestamp <= Date.now()) {
        throw new EmailServiceError(400, '提醒内容无效');
      }
      return {
        id: value.id as string,
        courseName: value.courseName as string,
        title: value.title as string,
        deadline: value.deadline as string,
        remainingText: value.remainingText as string,
        deadlineTimestamp: value.deadlineTimestamp
      };
    });

    const unsent = [] as typeof assignments;
    for (const item of assignments) {
      const key = `email-sent:${digest(email)}:${digest(`${item.id}|${item.deadlineTimestamp}`)}`;
      if (await redisCommand(['SET', key, '1', 'EX', 24 * 60 * 60, 'NX']) === 'OK') {
        reservedKeys.push(key);
        unsent.push(item);
      }
    }
    if (unsent.length === 0) return { sent: false, duplicate: true };

    subject = `NoDDL 提醒：${unsent.length} 项作业即将截止`;
    body = unsent.map(item => `${item.courseName} - ${item.title}\n截止：${item.deadline}（${item.remainingText}）`).join('\n\n');
  }

  const today = new Date().toISOString().slice(0, 10);
  const userLimitKey = `email-send:user:${digest(email)}:${today}`;
  const globalLimitKey = `email-send:global:${today}`;
  const userAllowed = await allowWithinLimit(userLimitKey, 10, 24 * 60 * 60);
  const globalAllowed = await allowWithinLimit(globalLimitKey, 400, 24 * 60 * 60);
  if (!userAllowed || !globalAllowed) {
    await Promise.all([
      releaseRateLimits([userLimitKey, globalLimitKey]),
      ...reservedKeys.map(key => redisCommand(['DEL', key]))
    ]);
    throw new EmailServiceError(429, '今日邮件提醒次数已达上限');
  }

  try {
    await sendEmail(email, subject, body);
  } catch (error) {
    await Promise.all([
      releaseRateLimits([userLimitKey, globalLimitKey]),
      ...reservedKeys.map(key => redisCommand(['DEL', key]))
    ]);
    throw error;
  }
  return { sent: true };
}

export async function unbindEmail(token: string): Promise<void> {
  const removed = await redisCommand(['DEL', `email-binding:${digest(token)}`]);
  if (removed !== 1) throw new EmailServiceError(401, '邮箱绑定已失效，请重新验证');
}
