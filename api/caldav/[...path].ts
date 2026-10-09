import { createHash } from 'node:crypto';
import { createDeadlineCalendar } from '../../src/core/calendar.js';
import { Assignment } from '../../src/core/types.js';
import { CalendarServiceError, readCalendarAssignments } from '../../src/server/calendar.js';
import type { ApiRequest } from '../../src/server/http.js';
import type { ServerResponse } from 'node:http';

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tokenFromRequest(request: ApiRequest): string {
  const pathname = new URL(request.url || '/', 'https://calendar.local').pathname;
  const marker = '/api/caldav/';
  const rest = pathname.slice(pathname.indexOf(marker) + marker.length);
  const pathToken = decodeURIComponent(rest.split('/')[0] || '');
  if (pathToken) return pathToken;

  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Basic ')) return '';
  try {
    const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
    return decoded.slice(decoded.indexOf(':') + 1);
  } catch {
    return '';
  }
}

function baseUrl(request: ApiRequest): string {
  const origin = request.headers.host ? `https://${request.headers.host}` : 'https://mail.sair-club.com';
  const pathname = new URL(request.url || '/api/caldav/', 'https://calendar.local').pathname;
  return `${origin}${pathname.endsWith('/') ? pathname : `${pathname}/`}`;
}

function eventHref(base: string, item: Assignment): string {
  return `${base}${encodeURIComponent(`${item.courseId || 'course'}-${item.id}`)}.ics`;
}

function eventXml(base: string, item: Assignment, calendar: string): string {
  return `<D:response><D:href>${xml(eventHref(base, item))}</D:href><D:propstat><D:prop><D:getetag>&quot;${createHash('sha1').update(calendar).digest('hex')}&quot;</D:getetag><C:calendar-data>${xml(calendar)}</C:calendar-data></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
}

function collectionXml(base: string, assignments: Assignment[]): string {
  const children = assignments.map(item => eventXml(base, item, createDeadlineCalendar([item], 'http://115.156.107.145') || '')).join('');
  return `<?xml version="1.0" encoding="utf-8" ?><D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:response><D:href>${xml(base)}</D:href><D:propstat><D:prop><D:displayname>NoDDL</D:displayname><D:resourcetype><D:collection/><C:calendar/></D:resourcetype><D:getetag>&quot;calendar&quot;</D:getetag><C:supported-calendar-component-set><C:comp name="VEVENT"/></C:supported-calendar-component-set></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>${children}</D:multistatus>`;
}

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  const token = tokenFromRequest(request);
  if (!token) {
    response.statusCode = 401;
    response.setHeader('WWW-Authenticate', 'Basic realm="NoDDL Calendar"');
    response.end('CalDAV credentials required');
    return;
  }
  try {
    const assignments = await readCalendarAssignments(token);
    const base = baseUrl(request);

    if (request.method === 'OPTIONS') {
      response.statusCode = 200;
      response.setHeader('DAV', '1, 2, calendar-access');
      response.setHeader('Allow', 'OPTIONS, PROPFIND, REPORT, GET');
      response.end();
      return;
    }

    if (request.method === 'PROPFIND' || request.method === 'REPORT') {
      response.statusCode = 207;
      response.setHeader('Content-Type', 'application/xml; charset=utf-8');
      response.end(collectionXml(base, assignments));
      return;
    }

    if (request.method === 'GET') {
      response.statusCode = 200;
      response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.end(createDeadlineCalendar(assignments, 'http://115.156.107.145') || 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n');
      return;
    }

    response.statusCode = 405;
    response.end('Method not allowed');
  } catch (error) {
    const status = error instanceof CalendarServiceError ? error.status : 500;
    response.statusCode = status;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.end(status === 500 ? 'Calendar service unavailable' : 'Calendar not found');
  }
}
