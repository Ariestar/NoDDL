import { HttpClient } from './types';

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
      throw new Error(`GET ${url} 响应错误: ${res.status}`);
    }
    return res.text();
  }

  async post(url: string, data?: unknown, headers: Record<string, string> = {}): Promise<string> {
    let bodyStr: any;
    const finalHeaders = { ...this.defaultHeaders, ...headers };

    if (typeof data === 'string') {
      bodyStr = data;
      if (!finalHeaders['Content-Type']) {
        finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    } else {
      bodyStr = JSON.stringify(data);
      if (!finalHeaders['Content-Type']) {
        finalHeaders['Content-Type'] = 'application/json';
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: finalHeaders,
      body: bodyStr
    });
    if (!res.ok) {
      throw new Error(`POST ${url} 响应错误: ${res.status}`);
    }
    return res.text();
  }
}
