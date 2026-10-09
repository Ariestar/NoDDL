import type { HttpClient } from '../core/types';

export const EMAIL_API_BASE_URL = (import.meta.env.VITE_EMAIL_API_BASE_URL || '').replace(/\/+$/, '');

export async function callEmailApi(
  http: HttpClient,
  path: string,
  body: unknown,
  token?: string
): Promise<Record<string, unknown>> {
  if (!EMAIL_API_BASE_URL) throw new Error('Email API URL is not configured');
  const response = await http.post(`${EMAIL_API_BASE_URL}/api/email/${path}`, body, token ? {
    Authorization: `Bearer ${token}`
  } : {});
  return JSON.parse(response) as Record<string, unknown>;
}
