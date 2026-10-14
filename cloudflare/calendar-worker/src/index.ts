const FEED_ORIGIN = 'https://mail.sair-club.com';

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tokenFromRequest(request: Request): string {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Basic ')) return '';
  try {
    const decoded = atob(authorization.slice(6));
    return decoded.slice(decoded.indexOf(':') + 1);
  } catch {
    return '';
  }
}

async function etag(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function splitEvents(calendar: string): string[] {
  return [...calendar.matchAll(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)].map(match => match[0]);
}

function singleCalendar(calendar: string, event: string): string {
  const start = calendar.indexOf('BEGIN:VCALENDAR');
  const firstEvent = calendar.indexOf('BEGIN:VEVENT');
  const prefix = firstEvent >= 0 ? calendar.slice(start, firstEvent) : calendar.slice(start);
  return `${prefix}${event}\r\nEND:VCALENDAR\r\n`;
}

function eventIndex(request: Request): number | null {
  const match = new URL(request.url).pathname.match(/\/event\/(\d+)\.ics$/);
  return match ? Number(match[1]) : null;
}

async function feed(token: string): Promise<Response> {
  return fetch(`${FEED_ORIGIN}/api/calendar/feed?token=${encodeURIComponent(token)}`, {
    headers: { 'User-Agent': 'NoDDL-Calendar-Worker/1.0' }
  });
}

function xmlResponse(body: string, status = 207): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      DAV: '1, 2, calendar-access'
    }
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const token = tokenFromRequest(request);
    if (request.method === 'OPTIONS') {
      if (!token) return new Response('CalDAV credentials required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Course Calendar"' }
      });
      return new Response(null, {
        status: 200,
        headers: { DAV: '1, 2, calendar-access', Allow: 'OPTIONS, PROPFIND, REPORT, GET, HEAD' }
      });
    }

    if (!token) return new Response('CalDAV credentials required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Course Calendar"' }
    });

    const response = await feed(token);
    if (!response.ok) return new Response('Calendar not found', { status: response.status });
    const calendar = await response.text();
    const calendarTag = await etag(calendar);
    const url = new URL(request.url);
    const events = splitEvents(calendar);
    const index = eventIndex(request);
    if (index !== null && (!Number.isInteger(index) || !events[index])) {
      return new Response('Calendar event not found', { status: 404 });
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      const eventCalendar = index === null ? calendar : singleCalendar(calendar, events[index]);
      const headers = new Headers({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ETag: `"${index === null ? calendarTag : `${calendarTag}-${index}`}"`
      });
      return new Response(request.method === 'HEAD' ? null : eventCalendar, { status: 200, headers });
    }

    if (request.method !== 'PROPFIND' && request.method !== 'REPORT') {
      return new Response('Method not allowed', { status: 405 });
    }

    const base = `${url.origin}${url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`}`;
    const children = events.map((event, index) => {
      const eventCalendar = singleCalendar(calendar, event);
      return `<D:response><D:href>${xml(`${base}event/${index}.ics`)}</D:href><D:propstat><D:prop><D:getetag>&quot;${calendarTag}-${index}&quot;</D:getetag><D:getcontenttype>text/calendar; component=&quot;VEVENT&quot;</D:getcontenttype><C:calendar-data>${xml(eventCalendar)}</C:calendar-data></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
    }).join('');
    return xmlResponse(`<?xml version="1.0" encoding="utf-8" ?><D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/"><D:response><D:href>${xml(base)}</D:href><D:propstat><D:prop><D:displayname>课程作业截止</D:displayname><D:resourcetype><D:collection/><C:calendar/></D:resourcetype><D:getetag>&quot;${calendarTag}&quot;</D:getetag><CS:getctag>${calendarTag}</CS:getctag><C:supported-calendar-component-set><C:comp name="VEVENT"/></C:supported-calendar-component-set><C:supported-calendar-data><C:calendar-data content-type="text/calendar" version="2.0"/></C:supported-calendar-data></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>${children}</D:multistatus>`);
  }
};
