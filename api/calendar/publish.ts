import { CalendarServiceError, publishCalendarFeed } from '../../src/server/calendar.js';
import { ApiRequest, clientIp, handleOptions, requestBody, sendJson } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (handleOptions(request, response)) return;
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' });

  try {
    const result = await publishCalendarFeed(clientIp(request), requestBody(request));
    sendJson(response, 200, result);
  } catch (error) {
    const status = error instanceof CalendarServiceError ? error.status : 500;
    if (status === 500) console.error('Calendar publish failed', error);
    sendJson(response, status, { error: status === 500 ? '日历服务暂时不可用' : (error as Error).message });
  }
}
