import type { Assignment } from './types.js';

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatIcsDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function foldIcsLine(line: string, encoder: TextEncoder): string {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;

  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    if (bytes + charBytes > 75) {
      parts.push(current);
      current = ` ${char}`;
      bytes = charBytes + 1;
    } else {
      current += char;
      bytes += charBytes;
    }
  }

  parts.push(current);
  return parts.join('\r\n');
}

export function createDeadlineCalendar(assignments: Assignment[], baseUrl: string): string | null {
  const upcoming = assignments
    .filter(item => Number.isFinite(item.deadlineTimestamp) && item.deadlineTimestamp > 0)
    .sort((a, b) => a.deadlineTimestamp - b.deadlineTimestamp);

  if (upcoming.length === 0) return null;

  const now = formatIcsDate(Date.now());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Course Deadline Calendar//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:课程作业截止'
  ];

  for (const item of upcoming) {
    const deadline = item.deadlineTimestamp;
    const url = new URL(item.url, baseUrl).href;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${encodeURIComponent(item.courseId || 'course')}-${encodeURIComponent(item.id)}@nodd-l`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcsDate(deadline - 60 * 1000)}`,
      `DTEND:${formatIcsDate(deadline)}`,
      `SUMMARY:${escapeIcsText(`${item.courseName} - ${item.title} 截止`)}`,
      `DESCRIPTION:${escapeIcsText(`截止时间：${item.deadline}\n课程：${item.courseName}`)}`,
      `URL:${url}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-P1D',
      `DESCRIPTION:${escapeIcsText(`${item.title} 明天截止`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT15M',
      `DESCRIPTION:${escapeIcsText(`${item.title} 即将截止`)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  const encoder = new TextEncoder();
  return `${lines.map(line => foldIcsLine(line, encoder)).join('\r\n')}\r\n`;
}

export function createEmptyCalendar(): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Course Deadline Calendar//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:课程作业截止',
    'END:VCALENDAR',
    ''
  ].join('\r\n');
}
