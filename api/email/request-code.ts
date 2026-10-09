import { requestEmailCode } from '../../src/server/email.js';
import { ApiRequest, clientIp, handleOptions, requestBody, sendApiError, sendJson } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (handleOptions(request, response)) return;
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' });

  try {
    await requestEmailCode(requestBody(request).email, clientIp(request));
    sendJson(response, 200, { sent: true });
  } catch (error) {
    sendApiError(response, error, 'Email verification request failed', '邮件服务暂时不可用');
  }
}
