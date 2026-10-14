import type { HttpClient } from '../core/types';
import { PLATFORM_SESSION_COOKIE } from '../core/constants';

export const AUTO_SYNC_TOKEN_KEY = 'nodd_auto_sync_token';

export function readCourseSessionCookie(): Promise<string> {
  if (typeof GM_cookie === 'undefined') throw new Error('当前脚本管理器不支持读取登录会话，请使用支持 GM_cookie 的 Tampermonkey');

  return new Promise((resolve, reject) => {
    GM_cookie.list({ url: window.location.href }, (cookies, error) => {
      if (error) {
        reject(new Error(`读取课程平台 Cookie 失败：${String(error)}`));
        return;
      }

      const sessionCookie = cookies.find(
        (item) => item.name === PLATFORM_SESSION_COOKIE && item.value.length > 0
      );
      const cookieNames = cookies.map((item) => item.name).filter(Boolean);
      if (!sessionCookie) {
        reject(new Error(`未找到课程平台登录会话（需要 ${PLATFORM_SESSION_COOKIE}；当前 Cookie：${cookieNames.join(', ') || '无'}）`));
        return;
      }

      const cookie = cookies.map((item) => `${item.name}=${item.value}`).join('; ');
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
