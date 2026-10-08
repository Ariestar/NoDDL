import { CourseGradingClient } from '../core/client';
import { parseActiveAssignmentsHtml, parseAssignmentDetailHtml } from '../core/parsers';
import { BrowserHttpClient, BrowserStorage } from './browser-adapter';
import { mountNoDDLUI, setupTestCaseCopyButtons, setupCodeAutoSave } from './ui';
import { PushConfig, Assignment } from '../core/types';

const storage = new BrowserStorage();
const http = new BrowserHttpClient();
const client = new CourseGradingClient({ baseUrl: window.location.origin }, http);

async function initNoDDL() {
  console.log('[NoDDL] 启动希冀平台只读监听助手');

  // 1. 注入辅助增强：一键复制测试用例 & 代码自动本地暂存
  setupTestCaseCopyButtons();
  setupCodeAutoSave();

  // 2. 读取配置与初始化作业列表
  const hoursThreshold = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);
  const seenIds = new Set<string>();
  const pendingList: Assignment[] = [];

  // A. 优先直接从当前页面 DOM 提取（侧边栏或活跃作业列表），零网络开销、100%匹配当前课程
  try {
    const domAssigns = parseActiveAssignmentsHtml(document.documentElement.innerHTML, '当前课程');
    for (const item of domAssigns) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        pendingList.push(item);
      }
    }
  } catch {}

  // B. 若当前处于作业/题目详情页（如 fileUploadList.jsp 或 programList.jsp），直接提取当前作业信息
  try {
    const urlMatch = window.location.href.match(/assignID=([a-zA-Z0-9_-]+)/i);
    if (urlMatch) {
      const curAssignId = urlMatch[1];
      const curDetail = parseAssignmentDetailHtml(document.documentElement.innerHTML);
      if (curDetail.deadline) {
        const existing = pendingList.find(a => a.id === curAssignId);
        if (existing) {
          existing.deadline = curDetail.deadline;
          existing.deadlineTimestamp = curDetail.deadlineTimestamp;
          existing.remainingHours = curDetail.remainingHours;
          existing.remainingText = curDetail.remainingText;
          if (curDetail.title) existing.title = curDetail.title;
        } else {
          pendingList.unshift({
            id: curAssignId,
            courseName: '当前课程',
            title: curDetail.title || `当前作业 (${curAssignId})`,
            deadline: curDetail.deadline,
            deadlineTimestamp: curDetail.deadlineTimestamp,
            remainingHours: curDetail.remainingHours,
            remainingText: curDetail.remainingText,
            status: 'pending',
            urgency: curDetail.remainingHours <= 6 ? 'critical' : curDetail.remainingHours <= 24 ? 'urgent' : 'normal',
            url: window.location.pathname + window.location.search
          });
          seenIds.add(curAssignId);
        }
      }
    }
  } catch {}

  // C. 只读请求当前课程活跃作业接口，绝不在后台切换课程上下文
  try {
    const apiAssigns = await client.getPendingAssignments(hoursThreshold);
    for (const item of apiAssigns) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        pendingList.push(item);
      }
    }
  } catch (err) {
    console.warn('[NoDDL] 接口只读拉取作业异常:', err);
  }

  // 3. 挂载右下角独立悬浮控制面板 (Shadow DOM 隔离，绝对不触碰原生页面结构与会话)
  mountNoDDLUI(client, storage, pendingList);

  // 4. 针对即将到期作业进行通知
  if (pendingList.length > 0) {
    const mostUrgent = pendingList.find(a => a.remainingHours > 0);
    if (mostUrgent && (mostUrgent.urgency === 'critical' || mostUrgent.urgency === 'urgent')) {
      if (typeof GM_notification !== 'undefined') {
        GM_notification({
          title: '🚨 NoDDL DDL 提醒',
          text: `【${mostUrgent.courseName}】${mostUrgent.title} ${mostUrgent.remainingText}，请尽快完成！`,
          timeout: 8000
        });
      }
    }

    const pushplusToken = (await storage.get('nodd_pushplus_token')) || '';
    const barkUrl = (await storage.get('nodd_bark_url')) || '';
    const pushConfig: PushConfig = { pushplusToken, barkUrl, hoursThreshold };
    if (pushplusToken || barkUrl) {
      client.triggerPushAlert(pushConfig).catch(console.error);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNoDDL);
} else {
  initNoDDL();
}
