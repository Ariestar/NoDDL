import { verifyEmailCode } from '../../src/server/email.js';
import { ApiRequest, handleOptions, requestBody, sendApiError, sendJson } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (handleOptions(request, response)) return;
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' });

  try {
    const body = requestBody(request);
    const result = await verifyEmailCode(body.email, body.code);
    sendJson(response, 200, result);
  } catch (error) {
    sendApiError(response, error, 'Email verification failed', '邮件服务暂时不可用');
  }
}
