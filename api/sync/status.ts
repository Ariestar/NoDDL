import { getAutoSyncStatus, refreshAutoSync, setAutoSyncEnabled } from '../../src/server/auto-sync.js';
import { ApiRequest, bearerToken, handleOptions, requestBody, sendApiError, sendJson } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (handleOptions(request, response)) return;
  try {
    const token = bearerToken(request);
    if (!token) return sendJson(response, 401, { error: '自动同步尚未绑定' });
    if (request.method === 'GET') {
      sendJson(response, 200, await getAutoSyncStatus(token));
      return;
    }
    if (request.method === 'POST') {
      const body = requestBody(request);
      if (body.action === 'refresh') {
        sendJson(response, 200, { assignments: await refreshAutoSync(token) });
        return;
      }
      if (typeof body.enabled !== 'boolean') return sendJson(response, 400, { error: '自动同步开关无效' });
      sendJson(response, 200, await setAutoSyncEnabled(token, body.enabled));
      return;
    }
    sendJson(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    sendApiError(response, error, 'Auto-sync status failed', '自动同步状态不可用');
  }
}
