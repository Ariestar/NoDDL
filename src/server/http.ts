import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

export function addCorsHeaders(response: ServerResponse): void {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

export function handleOptions(request: ApiRequest, response: ServerResponse): boolean {
  addCorsHeaders(response);
  if (request.method !== 'OPTIONS') return false;
  response.statusCode = 204;
  response.end();
  return true;
}

export function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

export function requestBody(request: ApiRequest): Record<string, unknown> {
  const value = request.body;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid JSON body');
  return value as Record<string, unknown>;
}

export function bearerToken(request: ApiRequest): string | null {
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

export function clientIp(request: ApiRequest): string {
  const realIp = request.headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp;
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',').at(-1)?.trim() || '';
  return Array.isArray(forwarded) ? forwarded.at(-1) || '' : '';
}
