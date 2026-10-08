import { UrgencyLevel } from './types';

export interface ParsedDeadline {
  raw: string;
  normalized: string;
  timestamp: number;
  remainingHours: number;
  remainingText: string;
  urgency: UrgencyLevel;
}

export function calculateUrgency(remainingHours: number): UrgencyLevel {
  if (remainingHours <= 0) return 'passed';
  if (remainingHours <= 6) return 'critical';
  if (remainingHours <= 24) return 'urgent';
  if (remainingHours <= 72) return 'warning';
  return 'normal';
}

export function formatRemainingTime(remainingHours: number): string {
  if (remainingHours <= 0) {
    const passed = Math.abs(remainingHours);
    if (passed < 24) {
      return `已超 DDL ${Math.max(1, Math.round(passed))} 小时`;
    }
    return `已超 DDL ${Math.floor(passed / 24)} 天`;
  }

  if (remainingHours < 1) {
    const mins = Math.max(1, Math.round(remainingHours * 60));
    return `仅剩 ${mins} 分钟`;
  }

  if (remainingHours < 24) {
    const hrs = Math.floor(remainingHours);
    const mins = Math.round((remainingHours - hrs) * 60);
    return mins > 0 ? `剩 ${hrs} 小时 ${mins} 分` : `剩 ${hrs} 小时`;
  }

  const days = Math.floor(remainingHours / 24);
  const hrs = Math.round(remainingHours % 24);
  return hrs > 0 ? `剩 ${days} 天 ${hrs} 小时` : `剩 ${days} 天`;
}

/**
 * 从希冀平台 HTML 或文本中提取精确截止时间
 * 希冀平台规范结构: "作业时间：<b>开始时间</b> 至 <b>截止时间</b>"
 * 无论传入整页 HTML 还是文本片段，都必须精准提取结束时间，绝对不匹配开始时间
 */
export function extractDeadlineFromText(text: string): string {
  if (!text) return '';

  // 1. 希冀平台专属强匹配: 作业时间：<b>...</b> 至 <b>...</b>
  const xijiTagMatch = text.match(/作业时间[：:\s]*<b[^>]*>[^<]*<\/b>\s*(?:至|到|~)\s*<b[^>]*>([^<]+)<\/b>/i);
  if (xijiTagMatch && xijiTagMatch[1]) {
    return xijiTagMatch[1].trim();
  }

  // 2. 标签内的结束日期: <b>...</b> 至 <b>YYYY-MM-DD HH:mm...</b>
  const tagRangeMatch = text.match(/<b[^>]*>[^<]*<\/b>\s*(?:至|到|~)\s*<b[^>]*>([\d\-/年月日. :]+)<\/b>/i);
  if (tagRangeMatch && tagRangeMatch[1]) {
    return tagRangeMatch[1].trim();
  }

  // 3. 时间范围（如 "2026-09-09 12:50:00 至 2026-10-15 00:00:00"），严格取结束时间
  const rangeParts = text.split(/\s*(?:至|到|~)\s*/);
  if (rangeParts.length > 1) {
    const candidate = rangeParts[rangeParts.length - 1].trim();
    const dateM = candidate.match(/\b(?:\d{4}[-/.年])?\d{1,2}[-/.月]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\b/);
    if (dateM) return dateM[0].trim();
  }

  // 4. 显式前缀: "截止时间：..."
  const kwMatch = text.match(/(?:截止|结束)(?:时间|日期)?[:：\s]*([\d\-/年月日. :]+)/i);
  if (kwMatch && kwMatch[1]) {
    return kwMatch[1].trim();
  }

  // 5. 独立标准日期字符串
  const exactDateMatch = text.trim().match(/^(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)$/);
  if (exactDateMatch && exactDateMatch[1]) {
    return exactDateMatch[1].trim();
  }

  return '';
}

/**
 * 健壮的北京时间 (UTC+8) DDL 解析器
 * 带严格的月 (1-12) 与日 (1-31) 边界校验，杜绝任何非日期文本误判为 00-00 导致 311 天 bug
 */
export function parseDeadlineBeijing(rawInput: string, nowMs = Date.now()): ParsedDeadline {
  const raw = rawInput.trim();
  if (!raw) {
    return emptyDeadline('未标注截止时间');
  }

  const extracted = extractDeadlineFromText(raw);
  if (!extracted) {
    return emptyDeadline(raw);
  }

  const clean = extracted
    .replace(/[年月]/g, '-')
    .replace(/[日号]/g, ' ')
    .replace(/[./]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const m = clean.match(/(?:(\d{4})-)?(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (!m) {
    return emptyDeadline(raw);
  }

  const curYear = new Date(nowMs).getFullYear();
  const y = m[1] ? parseInt(m[1], 10) : curYear;
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  const h = m[4] !== undefined ? parseInt(m[4], 10) : 23;
  const min = m[5] !== undefined ? parseInt(m[5], 10) : 59;
  const s = m[6] !== undefined ? parseInt(m[6], 10) : 0;

  // 严格合法性校验：非真实日期直接返回空，绝不输出 00-00
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h < 0 || h > 23 || min < 0 || min > 59) {
    return emptyDeadline(raw);
  }

  const ts = Date.UTC(y, mo - 1, d, h, min, s) - 8 * 3600 * 1000;
  const remHrs = Number(((ts - nowMs) / 3600000).toFixed(1));
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    raw,
    normalized: `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(min)}:${pad(s)}`,
    timestamp: ts,
    remainingHours: remHrs,
    remainingText: formatRemainingTime(remHrs),
    urgency: calculateUrgency(remHrs)
  };
}

function emptyDeadline(rawText: string): ParsedDeadline {
  return {
    raw: rawText,
    normalized: '请查看详情',
    timestamp: 0,
    remainingHours: 9999,
    remainingText: '待定',
    urgency: 'normal'
  };
}
