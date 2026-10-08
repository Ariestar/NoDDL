import { Assignment, UrgencyLevel } from './types';

/**
 * 根据剩余小时数评估紧急等级
 */
export function calculateUrgency(remainingHours: number): UrgencyLevel {
  if (remainingHours <= 0) return 'passed';
  if (remainingHours <= 6) return 'critical';
  if (remainingHours <= 24) return 'urgent';
  if (remainingHours <= 72) return 'warning';
  return 'normal';
}

/**
 * 格式化剩余时间为人性化中文
 */
export function formatRemainingTime(remainingHours: number): string {
  if (remainingHours <= 0) {
    const passedHours = Math.abs(remainingHours);
    if (passedHours < 24) {
      return `已截止 ${Math.round(passedHours)} 小时`;
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
 * 解析并标准化时间字符串为时间戳和剩余小时数
 */
export function parseDeadline(deadlineStr: string, nowMs = Date.now()): { timestamp: number; remainingHours: number; remainingText: string } {
  // 规范化常见格式如 "2026-10-10 23:59:00" 或 "2026/10/10 23:59"
  const cleanStr = deadlineStr.trim().replace(/-/g, '/');
  const timestamp = new Date(cleanStr).getTime();

  if (isNaN(timestamp)) {
    return {
      timestamp: 0,
      remainingHours: 9999,
      remainingText: '未知截止时间'
    };
  }

  const diffMs = timestamp - nowMs;
  const remainingHours = Number((diffMs / (1000 * 60 * 60)).toFixed(1));
  const remainingText = formatRemainingTime(remainingHours);

  return { timestamp, remainingHours, remainingText };
}

/**
 * 生成全渠道告警通知文本 (HTML / Markdown / 纯文本)
 */
export function formatNotificationContent(assignments: Assignment[]) {
  const pendingCount = assignments.length;
  const urgentCount = assignments.filter(a => a.urgency === 'critical' || a.urgency === 'urgent').length;

  const title = `【NoDDL 预警】有 ${pendingCount} 项作业待提交（${urgentCount} 项紧急）`;

  const markdownLines = [
    `### 🔔 NoDDL (Not Only DDL) 作业死线提醒`,
    `当前共有 **${pendingCount}** 项作业尚未提交，其中 **${urgentCount}** 项即将截止：`,
    '',
    ...assignments.map((item, idx) => {
      const emoji = item.urgency === 'critical' ? '🚨' : item.urgency === 'urgent' ? '⚠️' : '⏳';
      return `${idx + 1}. ${emoji} **${item.courseName}** - ${item.title}\n   - 截止时间：\`${item.deadline}\` (${item.remainingText})`;
    }),
    '',
    `*来源：武汉大学人工智能学院一体化专业课平台 (115.156.107.145)*`
  ];

  const htmlLines = [
    `<h3>🔔 NoDDL 作业死线催命符</h3>`,
    `<p>当前有 <b>${pendingCount}</b> 项未提交作业：</p>`,
    `<ul>`,
    ...assignments.map(item => {
      const color = item.urgency === 'critical' ? '#e53e3e' : item.urgency === 'urgent' ? '#dd6b20' : '#3182ce';
      return `<li><b>[${item.courseName}]</b> ${item.title} <span style="color:${color};font-weight:bold;">(${item.remainingText})</span><br><small>截止：${item.deadline}</small></li>`;
    }),
    `</ul>`
  ];

  return {
    title,
    markdown: markdownLines.join('\n'),
    html: htmlLines.join('\n')
  };
}
