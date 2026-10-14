import { createHash } from 'node:crypto';
import { createDeadlineCalendar, createEmptyCalendar } from '../core/calendar.js';
import { Assignment } from '../core/types.js';
import { CalendarServiceError, readCalendarAssignments } from './calendar.js';
import type { ApiRequest } from './http.js';
import type { ServerResponse } from 'node:http';

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tokenFromRequest(request: ApiRequest): string {
  const pathname = new URL(request.url || '/', 'https://calendar.local').pathname;
  const marker = '/api/caldav/';
  const markerIndex = pathname.indexOf(marker);
  const rest = markerIndex >= 0 ? pathname.slice(markerIndex + marker.length) : '';
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

function assignmentTag(item: Assignment): string {
  return createHash('sha1').update(JSON.stringify([
    item.id,
    item.courseId,
    item.courseName,
    item.title,
    item.deadline,
    item.deadlineTimestamp,
    item.status,
    item.url
  ])).digest('hex');
}

function assignmentsTag(assignments: Assignment[]): string {
  return createHash('sha1').update(assignments.map(assignmentTag).join('')).digest('hex');
}

function eventXml(base: string, item: Assignment, calendar: string): string {
  return `<D:response><D:href>${xml(eventHref(base, item))}</D:href><D:propstat><D:prop><D:getetag>&quot;${assignmentTag(item)}&quot;</D:getetag><D:getcontenttype>text/calendar; component=&quot;VEVENT&quot;</D:getcontenttype><C:calendar-data>${xml(calendar)}</C:calendar-data></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
}

function collectionXml(base: string, assignments: Assignment[], includeEvents: boolean): string {
  const calendars = assignments.map(item => createDeadlineCalendar([item], 'http://115.156.107.145') || '');
  const collectionTag = assignmentsTag(assignments);
  const children = includeEvents
    ? assignments.map((item, index) => eventXml(base, item, calendars[index])).join('')
    : '';
  return `<?xml version="1.0" encoding="utf-8" ?><D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/"><D:response><D:href>${xml(base)}</D:href><D:propstat><D:prop><D:displayname>课程作业截止</D:displayname><D:resourcetype><D:collection/><C:calendar/></D:resourcetype><D:getetag>&quot;${collectionTag}&quot;</D:getetag><CS:getctag>${collectionTag}</CS:getctag><C:supported-calendar-component-set><C:comp name="VEVENT"/></C:supported-calendar-component-set><C:supported-calendar-data><C:calendar-data content-type="text/calendar" version="2.0"/></C:supported-calendar-data></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>${children}</D:multistatus>`;
}

export default async function handler(request: ApiRequest, response: ServerResponse): Promise<void> {
  if (request.method === 'OPTIONS') {
    response.statusCode = 200;
    response.setHeader('DAV', '1, 2, calendar-access');
    response.setHeader('Allow', 'OPTIONS, PROPFIND, REPORT, GET, HEAD');
    response.end();
    return;
  }

  const token = tokenFromRequest(request);
  if (!token) {
    response.statusCode = 401;
    response.setHeader('WWW-Authenticate', 'Basic realm="Course Calendar"');
    response.end('CalDAV credentials required');
    return;
  }
  try {
    const assignments = await readCalendarAssignments(token);
    const base = baseUrl(request);

    if (request.method === 'PROPFIND' || request.method === 'REPORT') {
      response.statusCode = 207;
      response.setHeader('DAV', '1, 2, calendar-access');
      response.setHeader('Content-Type', 'application/xml; charset=utf-8');
      response.end(collectionXml(base, assignments, true));
      return;
    }

    if (request.method === 'GET') {
      const calendar = createDeadlineCalendar(assignments, 'http://115.156.107.145') || createEmptyCalendar();
      response.statusCode = 200;
      response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.setHeader('ETag', `"${assignmentsTag(assignments)}"`);
      response.end(calendar);
      return;
    }

    if (request.method === 'HEAD') {
      response.statusCode = 200;
      response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.end();
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
