import { getAutoSyncAssignments } from '../../src/server/auto-sync.js';
import { ApiRequest, bearerToken, handleOptions, sendApiError, sendJson } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (handleOptions(request, response)) return;
  if (request.method !== 'GET') return sendJson(response, 405, { error: 'Method not allowed' });

  try {
    const token = bearerToken(request);
    if (!token) return sendJson(response, 401, { error: '自动同步尚未绑定' });
    sendJson(response, 200, { assignments: await getAutoSyncAssignments(token) });
  } catch (error) {
    sendApiError(response, error, 'Auto-sync assignments failed', '自动同步数据不可用');
  }
}
