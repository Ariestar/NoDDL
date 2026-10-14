import { HttpClient, StorageAdapter } from '../core/types';

function requestExtension(method: string, url: string, headers: Record<string, string>, body?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'nodd-http', request: { method, url, headers, body } }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        const detail = response?.body?.trim();
        reject(new Error(`扩展请求 ${method} ${url} 失败: ${response?.status || 0}${detail ? `: ${detail}` : ''}`));
        return;
      }
      resolve(response.body || '');
    });
  });
}

export class BrowserHttpClient implements HttpClient {
  async get(url: string, headers: Record<string, string> = {}): Promise<string> {
    if (new URL(url, window.location.href).origin !== window.location.origin) {
      return requestExtension('GET', url, headers);
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

    if (new URL(url, window.location.href).origin !== window.location.origin) {
      return requestExtension('POST', url, finalHeaders, bodyStr);
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

export class BrowserStorage implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}
