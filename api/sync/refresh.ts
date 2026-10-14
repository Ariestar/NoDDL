import { refreshAutoSync } from '../../src/server/auto-sync.js';
import { ApiRequest, bearerToken, handleOptions, sendApiError, sendJson } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (handleOptions(request, response)) return;
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' });

  try {
    const token = bearerToken(request);
    if (!token) return sendJson(response, 401, { error: '自动同步尚未绑定' });
    sendJson(response, 200, { assignments: await refreshAutoSync(token) });
  } catch (error) {
    sendApiError(response, error, 'Auto-sync refresh failed', '自动同步刷新失败');
  }
}
