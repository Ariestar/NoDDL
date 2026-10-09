import { EmailServiceError, verifyEmailCode } from '../../src/server/email.js';
import { ApiRequest, handleOptions, requestBody, sendJson } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (handleOptions(request, response)) return;
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' });

  try {
    const body = requestBody(request);
    const result = await verifyEmailCode(body.email, body.code);
    sendJson(response, 200, result);
  } catch (error) {
    const status = error instanceof EmailServiceError ? error.status : 500;
    if (status === 500) console.error('Email verification failed', error);
    sendJson(response, status, { error: status === 500 ? '邮件服务暂时不可用' : (error as Error).message });
  }
}
