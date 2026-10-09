import test from 'node:test';
import assert from 'node:assert/strict';
import { sendEmail } from '../src/server/resend';

test('Resend API sends a plain-text email with a server-side API key', async () => {
  const oldEnv = {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM
  };
  process.env.RESEND_API_KEY = 're_test_api_key';
  process.env.RESEND_FROM = 'NoDDL <mail@example.com>';
  let request: { url: string; init?: RequestInit } | undefined;

  try {
    const id = await sendEmail('student@example.com', 'NoDDL 测试', '截止时间提醒', async (input, init) => {
      request = { url: String(input), init };
      return new Response(JSON.stringify({ id: 'test-message-id' }), { status: 200 });
    });

    assert.equal(id, 'test-message-id');
    assert.equal(request?.url, 'https://api.resend.com/emails');
    assert.equal((request?.init?.headers as Record<string, string>).Authorization, 'Bearer re_test_api_key');
    assert.deepEqual(JSON.parse(String(request?.init?.body)), {
      from: 'NoDDL <mail@example.com>',
      to: ['student@example.com'],
      subject: 'NoDDL 测试',
      text: '截止时间提醒'
    });
  } finally {
    if (oldEnv.apiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldEnv.apiKey;
    if (oldEnv.from === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = oldEnv.from;
  }
});

test('email binding verifies codes, sends alerts once, and can be removed', async () => {
  const envKeys = [
    'RESEND_API_KEY', 'RESEND_FROM', 'EMAIL_CODE_SECRET',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'
  ];
  const oldEnv = new Map(envKeys.map(key => [key, process.env[key]]));
  const oldFetch = globalThis.fetch;
  for (const key of envKeys) process.env[key] = `test-${key}-with-a-long-secret-value`;
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test';
  process.env.EMAIL_CODE_SECRET = '01234567890123456789012345678901';

  const values = new Map<string, string>();
  const counters = new Map<string, number>();
  const sentMessages: Array<{ to: string; text: string }> = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === 'https://redis.test') {
      const command = JSON.parse(String(init?.body)) as Array<string | number>;
      const [name, key, value] = command;
      if (name === 'EVAL') {
        const redisKey = String(command[3]);
        const count = (counters.get(redisKey) || 0) + 1;
        counters.set(redisKey, count);
        return new Response(JSON.stringify({ result: count }), { status: 200 });
      }
      if (name === 'SET') {
        if (command.includes('NX') && values.has(String(key))) {
          return new Response(JSON.stringify({ result: null }), { status: 200 });
        }
        values.set(String(key), String(value));
        return new Response(JSON.stringify({ result: 'OK' }), { status: 200 });
      }
      if (name === 'GET') {
        return new Response(JSON.stringify({ result: values.get(String(key)) ?? null }), { status: 200 });
      }
      if (name === 'DEL') {
        const removed = command.slice(1).filter(item => values.delete(String(item))).length;
        return new Response(JSON.stringify({ result: removed }), { status: 200 });
      }
      throw new Error(`Unexpected Redis command: ${String(name)}`);
    }
    if (url === 'https://api.resend.com/emails') {
      const message = JSON.parse(String(init?.body)) as { to: string[]; text: string };
      sentMessages.push({ to: message.to[0], text: message.text });
      return new Response(JSON.stringify({ id: `message-${sentMessages.length}` }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const { requestEmailCode, verifyEmailCode, sendEmailAlert, unbindEmail, EmailServiceError } = await import('../src/server/email');
    await requestEmailCode('Student@Example.com', '192.0.2.1');
    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0].to, 'student@example.com');
    const code = sentMessages[0].text.match(/验证码是 (\d{6})/)?.[1];
    assert.ok(code);

    const binding = await verifyEmailCode('student@example.com', code);
    assert.equal(binding.email, 'student@example.com');
    const assignments = [{
      id: 'assignment-1',
      courseName: '算法',
      title: '第三次作业',
      deadline: '2026-12-01 23:59',
      remainingText: '剩 3 小时',
      deadlineTimestamp: Date.now() + 3 * 60 * 60 * 1000
    }];

    const result = await sendEmailAlert(binding.token, { assignments });
    assert.equal(result.sent, true);
    assert.equal(sentMessages.length, 2);
    assert.match(sentMessages[1].text, /第三次作业/);
    assert.deepEqual(await sendEmailAlert(binding.token, { assignments }), { sent: false, duplicate: true });
    assert.equal(sentMessages.length, 2);

    await unbindEmail(binding.token);
    await assert.rejects(
      () => sendEmailAlert(binding.token, { assignments }),
      error => error instanceof EmailServiceError && error.status === 401
    );
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key, value] of oldEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
