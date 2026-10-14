import handler from '../src/server/caldav.js';
import type { ApiRequest } from '../src/server/http.js';
import type { ServerResponse } from 'node:http';

export default function caldav(request: ApiRequest, response: ServerResponse): Promise<void> {
  return handler(request, response);
}
