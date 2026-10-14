import { HttpClient, StorageAdapter } from '../core/types';

export class BrowserHttpClient implements HttpClient {
  async get(url: string, headers: Record<string, string> = {}): Promise<string> {
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
