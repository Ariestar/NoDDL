import { randomBytes, createHash } from 'node:crypto';
import { createDeadlineCalendar } from '../core/calendar.js';
import { Assignment } from '../core/types.js';
import { redisCommand } from './redis.js';

const FEED_TTL_SECONDS = 180 * 24 * 60 * 60;
const MAX_ASSIGNMENTS = 200;

export class CalendarServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function feedKey(token: string): string {
  return `calendar-feed:${digest(token)}`;
}

function validateAssignments(value: unknown): Assignment[] {
  if (!Array.isArray(value) || value.length > MAX_ASSIGNMENTS) {
    throw new CalendarServiceError(400, '日历数据无效');
  }

  const assignments = value.map(item => {
    if (!item || typeof item !== 'object') throw new CalendarServiceError(400, '日历数据无效');
    const candidate = item as Record<string, unknown>;
    const required = [candidate.id, candidate.courseName, candidate.title, candidate.deadline, candidate.remainingText, candidate.url];
    if (required.some(field => typeof field !== 'string' || !field || field.length > 300)) {
      throw new CalendarServiceError(400, '日历数据无效');
    }
    if (typeof candidate.deadlineTimestamp !== 'number' || !Number.isFinite(candidate.deadlineTimestamp)) {
      throw new CalendarServiceError(400, '日历数据无效');
    }
    return candidate as unknown as Assignment;
  });

  return assignments;
}

export async function publishCalendarFeed(
  authToken: string,
  input: { assignments?: unknown; feedToken?: unknown }
): Promise<{ feedToken: string; assignments: number }> {
  const email = await redisCommand(['GET', `email-binding:${digest(authToken)}`]);
  if (typeof email !== 'string') throw new CalendarServiceError(401, '邮箱绑定已失效，请重新验证');

  const assignments = validateAssignments(input.assignments);
  const existingToken = typeof input.feedToken === 'string' ? input.feedToken : '';
  let feedToken = existingToken;

  if (feedToken) {
    const existing = await redisCommand(['HGET', feedKey(feedToken), 'email']);
    if (existing !== email) throw new CalendarServiceError(403, '日历订阅地址无效');
  } else {
    feedToken = randomBytes(32).toString('base64url');
  }

  const key = feedKey(feedToken);
  await redisCommand(['HSET', key, 'email', email, 'assignments', JSON.stringify(assignments)]);
  await redisCommand(['EXPIRE', key, FEED_TTL_SECONDS]);
  return { feedToken, assignments: assignments.length };
}

export async function readCalendarFeed(feedToken: string): Promise<string> {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(feedToken)) {
    throw new CalendarServiceError(404, '日历不存在');
  }

  const raw = await redisCommand(['HGET', feedKey(feedToken), 'assignments']);
  if (typeof raw !== 'string') throw new CalendarServiceError(404, '日历不存在');
  const assignments = JSON.parse(raw) as Assignment[];
  return createDeadlineCalendar(assignments, 'http://115.156.107.145') || [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NoDDL//Assignment Deadlines//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:NoDDL 作业截止',
    'END:VCALENDAR',
    ''
  ].join('\r\n');
}
