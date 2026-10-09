import { CalendarServiceError, readCalendarFeed } from '../../src/server/calendar.js';
import type { ServerResponse } from 'node:http';
import type { ApiRequest } from '../../src/server/http.js';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.end('Method not allowed');
    return;
  }

  try {
    const token = typeof request.url === 'string'
      ? new URL(request.url, 'https://calendar.local').searchParams.get('token') || ''
      : '';
    const calendar = await readCalendarFeed(token);
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.end(calendar);
  } catch (error) {
    const status = error instanceof CalendarServiceError ? error.status : 500;
    if (status === 500) console.error('Calendar feed failed', error);
    response.statusCode = status;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.end(status === 500 ? 'Calendar service unavailable' : 'Calendar not found');
  }
}
