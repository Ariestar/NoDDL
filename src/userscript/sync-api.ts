import type { HttpClient } from '../core/types';

export const AUTO_SYNC_TOKEN_KEY = 'nodd_auto_sync_token';

interface CookieItem {
  name: string;
  value: string;
}

export function readCourseSessionCookie(): Promise<string> {
  const visibleCookie = document.cookie;
  if (/(?:^|;\s*)JSESSIONID=[^;]+/i.test(visibleCookie)) return Promise.resolve(visibleCookie);
  if (typeof GM_cookie === 'undefined') throw new Error('当前脚本管理器不支持读取登录会话，请使用支持 GM_cookie 的 Tampermonkey');

  return new Promise((resolve, reject) => {
    GM_cookie.list({ url: 'http://115.156.107.145/' }, (cookies, error) => {
      if (error) {
        reject(new Error(error));
        return;
      }
      const cookie = cookies.map((item: CookieItem) => `${item.name}=${item.value}`).join('; ');
      if (!/(?:^|;\s*)JSESSIONID=[^;]+/i.test(cookie)) {
        reject(new Error('未找到课程平台登录会话'));
        return;
      }
      resolve(cookie);
    });
  });
}

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
