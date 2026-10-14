import { bindAutoSync } from '../../src/server/auto-sync.js';
import { ApiRequest, clientIp, handleOptions, requestBody, sendApiError, sendJson } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (handleOptions(request, response)) return;
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' });

  try {
    const result = await bindAutoSync(requestBody(request), clientIp(request));
    sendJson(response, 200, result);
  } catch (error) {
    sendApiError(response, error, 'Auto-sync binding failed', '自动同步绑定失败');
  }
}
