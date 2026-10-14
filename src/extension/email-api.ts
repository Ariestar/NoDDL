import type { HttpClient, StorageAdapter } from '../core/types';

export const DEFAULT_API_BASE_URL = normalizeApiBaseUrl(import.meta.env?.VITE_EMAIL_API_BASE_URL || '');
export const API_BASE_URL_STORAGE_KEY = 'nodd_api_base_url';

export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const localHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(localHost && url.protocol === 'http:')) return '';
    if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) return '';
    return url.origin;
  } catch {
    return '';
  }
}

export async function getServiceConfig(storage: StorageAdapter) {
  const saved = await storage.get(API_BASE_URL_STORAGE_KEY);
  const baseUrl = saved === null ? DEFAULT_API_BASE_URL : normalizeApiBaseUrl(saved);
  // Existing unscoped credentials belong only to the original build-time service.
  const prefix = !baseUrl ? 'disabled:' : baseUrl === DEFAULT_API_BASE_URL ? '' : `${baseUrl}:`;
  const scopedStorage: StorageAdapter = {
    get: key => storage.get(`${prefix}${key}`),
    set: (key, value) => storage.set(`${prefix}${key}`, value),
    remove: key => storage.remove(`${prefix}${key}`)
  };
  return { baseUrl, storage: scopedStorage };
}

export type ServiceConfig = Awaited<ReturnType<typeof getServiceConfig>>;

export async function callEmailApi(
  http: HttpClient,
  baseUrl: string,
  path: string,
  body: unknown,
  token?: string
): Promise<Record<string, unknown>> {
  if (!baseUrl) throw new Error('API URL is not configured');
  const response = await http.post(`${baseUrl}/api/email/${path}`, body, token ? {
    Authorization: `Bearer ${token}`
  } : {});
  return JSON.parse(response) as Record<string, unknown>;
}
