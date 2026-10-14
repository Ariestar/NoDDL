import type { HttpClient } from '../core/types';

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
