import { HttpClient, StorageAdapter } from '../core/types';

/**
 * 油猴脚本环境下的 HTTP 适配器
 * 本域请求走原生 window.fetch（自动携带 Cookie）
 * 跨域请求（如微信/Bark推送）走 GM_xmlhttpRequest 绕过浏览器同源策略 (CORS)
 */
export class BrowserHttpClient implements HttpClient {
  async get(url: string, headers: Record<string, string> = {}): Promise<string> {
    const isCrossOrigin = /^https?:\/\//i.test(url) && !url.includes(window.location.host);

    if (isCrossOrigin && typeof GM_xmlhttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          headers,
          onload: res => {
            if (res.status >= 200 && res.status < 300) {
              resolve(res.responseText);
            } else {
              reject(new Error(`GM_xmlhttpRequest GET 失败: ${res.status}`));
            }
          },
          onerror: err => reject(err)
        });
      });
    }

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers
    });
    if (!res.ok) {
      throw new Error(`fetch GET ${url} 状态错误: ${res.status}`);
    }
    return res.text();
  }

  async post(url: string, data?: unknown, headers: Record<string, string> = {}): Promise<string> {
    const isCrossOrigin = /^https?:\/\//i.test(url) && !url.includes(window.location.host);

    let bodyStr = '';
    const finalHeaders = { ...headers };

    if (typeof data === 'string') {
      bodyStr = data;
    } else {
      bodyStr = JSON.stringify(data);
      if (!finalHeaders['Content-Type']) {
        finalHeaders['Content-Type'] = 'application/json';
      }
    }

    if (isCrossOrigin && typeof GM_xmlhttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'POST',
          url,
          headers: finalHeaders,
          data: bodyStr,
          onload: res => {
            if (res.status >= 200 && res.status < 300) {
              resolve(res.responseText);
            } else {
              reject(new Error(`GM_xmlhttpRequest POST 失败: ${res.status}`));
            }
          },
          onerror: err => reject(err)
        });
      });
    }

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: finalHeaders,
      body: bodyStr
    });
    if (!res.ok) {
      throw new Error(`fetch POST ${url} 状态错误: ${res.status}`);
    }
    return res.text();
  }
}

/**
 * 油猴持久化存储适配器
 */
export class BrowserStorage implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    if (typeof GM_getValue !== 'undefined') {
      const val = GM_getValue<string>(key, '');
      return val || null;
    }
    return localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (typeof GM_setValue !== 'undefined') {
      GM_setValue(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  }

  async remove(key: string): Promise<void> {
    if (typeof GM_setValue !== 'undefined') {
      GM_setValue(key, '');
    } else {
      localStorage.removeItem(key);
    }
  }
}
