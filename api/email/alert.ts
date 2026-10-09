import { sendEmailAlert } from '../../src/server/email.js';
import { ApiRequest, bearerToken, handleOptions, requestBody, sendApiError, sendJson } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (handleOptions(request, response)) return;
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' });

  const token = bearerToken(request);
  if (!token) return sendJson(response, 401, { error: '请先绑定邮箱' });

  try {
    const result = await sendEmailAlert(token, requestBody(request));
    sendJson(response, 200, result);
  } catch (error) {
    sendApiError(response, error, 'Email alert failed', '邮件服务暂时不可用');
  }
}
