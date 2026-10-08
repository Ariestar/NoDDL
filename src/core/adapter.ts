import { HttpClient } from './types';

/**
 * 原生 Fetch HTTP 适配器（Node 18+ 或 浏览器均可使用）
 */
export class FetchHttpClient implements HttpClient {
  private defaultHeaders: Record<string, string>;

  constructor(defaultHeaders: Record<string, string> = {}) {
    this.defaultHeaders = defaultHeaders;
  }

  async get(url: string, headers: Record<string, string> = {}): Promise<string> {
    const res = await fetch(url, {
      method: 'GET',
      headers: { ...this.defaultHeaders, ...headers }
    });
    if (!res.ok) {
      throw new Error(`HTTP GET ${url} 失败: ${res.status} ${res.statusText}`);
    }
    return res.text();
  }

  async post(url: string, data?: unknown, headers: Record<string, string> = {}): Promise<string> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const isUrlEncoded = typeof data === 'string' && data.includes('=');

    let body: any;
    const finalHeaders = { ...this.defaultHeaders, ...headers };

    if (isFormData || typeof data === 'string') {
      body = data;
    } else if (isUrlEncoded) {
      body = data;
      finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      body = JSON.stringify(data);
      if (!finalHeaders['Content-Type']) {
        finalHeaders['Content-Type'] = 'application/json';
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: finalHeaders,
      body
    });

    if (!res.ok) {
      throw new Error(`HTTP POST ${url} 失败: ${res.status} ${res.statusText}`);
    }
    return res.text();
  }
}
