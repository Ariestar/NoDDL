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
 * 评估截止时间紧迫度等级
 */
export function calculateUrgency(remainingHours: number): UrgencyLevel {
  if (remainingHours <= 0) return 'passed';
  if (remainingHours <= 6) return 'critical';
  if (remainingHours <= 24) return 'urgent';
  if (remainingHours <= 72) return 'warning';
  return 'normal';
}

/**
 * 格式化剩余时间为人性化倒计时 / 逾期提示
 */
export function formatRemainingTime(remainingHours: number): string {
  if (remainingHours <= 0) {
    const passedHours = Math.abs(remainingHours);
    if (passedHours < 24) {
      return `已超 DDL ${Math.max(1, Math.round(passedHours))} 小时`;
    }
    return `已超 DDL ${Math.floor(passedHours / 24)} 天`;
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
 * 从文本或时间范围中精确提取截止时间
 * 核心逻辑：若存在 "开始时间 至 截止时间" 或 "~"，精准提取分隔符右侧的结束时间，杜绝误识别开始时间
 */
export function extractDeadlineFromText(text: string): string {
  if (!text) return '';

  // 1. 若为 "开始 至 截止" 范围，直接取分隔符右侧的日期
  const range = text.split(/\s*(?:至|到|~|-{2,})\s*/);
  if (range.length > 1) {
    return range[range.length - 1].trim();
  }

  // 2. 若带有 "截止[时间]" 前缀
  const kw = text.match(/(?:截止|结束)(?:时间|日期)?[:：\s]*([^\n<]+)/i);
  if (kw) return kw[1].trim();

  // 3. 将常见年月日字符替换为标准分隔符后提取有效日期，取最后一个
  const cleaned = text.replace(/[年月日]/g, (m) => (m === '日' ? ' ' : '-'));
  const dates = cleaned.match(/\b(?:\d{4}[-/.])?\d{1,2}[-/.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\b/g);
  return dates ? dates[dates.length - 1].trim() : text.trim();
}

/**
 * 北京时间 (UTC+8) DDL 解析器
 * 增加月份 (1-12) 与日期 (1-31) 强校验，彻底杜绝把非日期数字识别为 0月0日 导致算成 300 多天前
 */
export function parseDeadlineBeijing(rawInput: string, nowMs = Date.now()): ParsedDeadline {
  const raw = rawInput.trim();
  if (!raw) {
    return emptyDeadline('未标注截止时间');
  }

  const target = extractDeadlineFromText(raw);

  const clean = target
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

  // 强校验月份 (1-12) 与日期 (1-31)，杜绝 00-00 误匹配
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h < 0 || h > 23 || min < 0 || min > 59) {
    return emptyDeadline(raw);
  }

  // 强制按照东八区 (UTC+8) 计算绝对时间戳
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
