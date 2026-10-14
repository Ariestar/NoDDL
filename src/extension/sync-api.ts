import type { Assignment, HttpClient } from '../core/types';

export const AUTO_SYNC_TOKEN_KEY = 'nodd_auto_sync_token';

export async function bindAutomaticSync(
  http: HttpClient,
  baseUrl: string,
  cookie: string,
  token?: string,
  feedToken?: string
): Promise<{ token: string; feedToken: string }> {
  const response = await http.post(`${baseUrl}/api/sync/bind`, { cookie, token, feedToken });
  const result = JSON.parse(response) as { token?: unknown; feedToken?: unknown };
  if (typeof result.token !== 'string' || typeof result.feedToken !== 'string') {
    throw new Error('自动同步绑定响应无效');
  }
  return { token: result.token, feedToken: result.feedToken };
}

export async function getAutomaticSyncStatus(
  http: HttpClient,
  baseUrl: string,
  token: string
): Promise<{ enabled: boolean }> {
  const response = await http.get(`${baseUrl}/api/sync/status`, {
    Authorization: `Bearer ${token}`
  });
  const result = JSON.parse(response) as { enabled?: unknown };
  if (typeof result.enabled !== 'boolean') throw new Error('自动同步状态响应无效');
  return { enabled: result.enabled };
}

export async function setAutomaticSyncEnabled(
  http: HttpClient,
  baseUrl: string,
  token: string,
  enabled: boolean
): Promise<void> {
  const response = await http.post(`${baseUrl}/api/sync/status`, { enabled }, {
    Authorization: `Bearer ${token}`
  });
  const result = JSON.parse(response) as { enabled?: unknown };
  if (result.enabled !== enabled) throw new Error('自动同步状态更新失败');
}

export async function refreshAutomaticSync(
  http: HttpClient,
  baseUrl: string,
  token: string
): Promise<Assignment[]> {
  const response = await http.post(`${baseUrl}/api/sync/status`, { action: 'refresh' }, {
    Authorization: `Bearer ${token}`
  });
  const result = JSON.parse(response) as { assignments?: unknown };
  if (!Array.isArray(result.assignments)) throw new Error('自动同步刷新响应无效');
  return result.assignments as Assignment[];
}
