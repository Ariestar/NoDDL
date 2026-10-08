import { UrgencyLevel } from './types';

export interface ParsedDeadline {
  raw: string;
  normalized: string;
  timestamp: number;
  remainingHours: number;
  remainingText: string;
  urgency: UrgencyLevel;
}

/**
 * 评估截止时间紧急度等级
 */
export function calculateUrgency(remainingHours: number): UrgencyLevel {
  if (remainingHours <= 0) return 'passed';
  if (remainingHours <= 6) return 'critical';
  if (remainingHours <= 24) return 'urgent';
  if (remainingHours <= 72) return 'warning';
  return 'normal';
}

/**
 * 格式化剩余时间为人性化中文倒计时
 */
export function formatRemainingTime(remainingHours: number): string {
  if (remainingHours <= 0) {
    const passedHours = Math.abs(remainingHours);
    if (passedHours < 24) {
      return `已截止 ${Math.max(1, Math.round(passedHours))} 小时`;
    }
    return `已截止 ${Math.floor(passedHours / 24)} 天`;
  }

  if (remainingHours < 1) {
    const mins = Math.max(1, Math.round(remainingHours * 60));
    return `仅剩 ${mins} 分钟`;
  }

  if (remainingHours < 24) {
    const hrs = Math.floor(remainingHours);
    const mins = Math.round((remainingHours - hrs) * 60);
    return mins > 0 ? `剩余 ${hrs} 小时 ${mins} 分` : `剩余 ${hrs} 小时`;
  }

  const days = Math.floor(remainingHours / 24);
  const hrs = Math.round(remainingHours % 24);
  return hrs > 0 ? `剩余 ${days} 天 ${hrs} 小时` : `剩余 ${days} 天`;
}

/**
 * 健壮的北京时间 (UTC+8) 死线解析器
 * 1. 自动处理缺少年份（如 "10-15 23:59" 或 "10月15日 23:59"）
 * 2. 自动清洗中文字符（年月日、点分隔符、斜杠）
 * 3. 强制锚定北京时间 (UTC+8)，杜绝本机时区导致偏差 8 小时
 */
export function parseDeadlineBeijing(rawDeadlineStr: string, nowMs = Date.now()): ParsedDeadline {
  const raw = rawDeadlineStr.trim();
  if (!raw) {
    return createEmptyDeadline('未标注截止时间');
  }

  // 1. 中文日期标准化转换: "2026年10月15日 23:59" -> "2026-10-15 23:59"
  let cleaned = raw
    .replace(/[年月]/g, '-')
    .replace(/[日号]/g, ' ')
    .replace(/\./g, '-')
    .replace(/\//g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. 匹配完整格式: YYYY-MM-DD HH:mm(:ss)?
  const fullMatch = cleaned.match(/(?:截止[：:\s]*)?(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);

  // 3. 匹配缺年格式: MM-DD HH:mm(:ss)?
  const noYearMatch = cleaned.match(/(?:截止[：:\s]*)?(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);

  let year: number;
  let month: number;
  let day: number;
  let hour = 23;
  let minute = 59;
  let second = 0;

  const currentYear = new Date(nowMs).getFullYear();

  if (fullMatch && fullMatch[1]) {
    year = parseInt(fullMatch[1], 10);
    month = parseInt(fullMatch[2], 10);
    day = parseInt(fullMatch[3], 10);
    if (fullMatch[4] !== undefined) hour = parseInt(fullMatch[4], 10);
    if (fullMatch[5] !== undefined) minute = parseInt(fullMatch[5], 10);
    if (fullMatch[6] !== undefined) second = parseInt(fullMatch[6], 10);
  } else if (noYearMatch && noYearMatch[1]) {
    year = currentYear;
    month = parseInt(noYearMatch[1], 10);
    day = parseInt(noYearMatch[2], 10);
    if (noYearMatch[3] !== undefined) hour = parseInt(noYearMatch[3], 10);
    if (noYearMatch[4] !== undefined) minute = parseInt(noYearMatch[4], 10);
    if (noYearMatch[5] !== undefined) second = parseInt(noYearMatch[5], 10);
  } else {
    return createEmptyDeadline(raw);
  }

  // 4. 强制按照东八区 (UTC+8) 计算绝对毫秒时间戳
  const beijingTimestamp = Date.UTC(year, month - 1, day, hour, minute, second) - 8 * 3600 * 1000;

  const diffMs = beijingTimestamp - nowMs;
  const remainingHours = Number((diffMs / (1000 * 60 * 60)).toFixed(1));
  const remainingText = formatRemainingTime(remainingHours);
  const urgency = calculateUrgency(remainingHours);

  const pad = (n: number) => String(n).padStart(2, '0');
  const normalized = `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;

  return {
    raw,
    normalized,
    timestamp: beijingTimestamp,
    remainingHours,
    remainingText,
    urgency
  };
}

function createEmptyDeadline(rawText: string): ParsedDeadline {
  return {
    raw: rawText,
    normalized: rawText,
    timestamp: 0,
    remainingHours: 9999,
    remainingText: '待定',
    urgency: 'normal'
  };
}
