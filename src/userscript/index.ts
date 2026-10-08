import { CourseGradingClient } from '../core/client';
import { parseActiveAssignmentsHtml, parseAssignmentDetailHtml } from '../core/parsers';
import { BrowserHttpClient, BrowserStorage } from './browser-adapter';
import { mountNoDDLUI, setupTestCaseCopyButtons, setupCodeAutoSave } from './ui';
import { PushConfig, Assignment } from '../core/types';

const storage = new BrowserStorage();
const http = new BrowserHttpClient();
const client = new CourseGradingClient({ baseUrl: window.location.origin }, http, storage);

async function initNoDDL() {
  console.log('[NoDDL] 启动希冀平台本地数据库与作业助手');

  // 1. 注入辅助增强：一键复制测试用例 & 代码自动本地暂存
  setupTestCaseCopyButtons();
  setupCodeAutoSave();

  const seenIds = new Set<string>();
  const pendingList: Assignment[] = [];

  // A. 首先从本地持久化数据库加载全部已缓存课程的作业（实现跨课程统一沉淀）
  if (client.db) {
    try {
      const cached = await client.db.getAllAssignments();
      for (const item of cached) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          pendingList.push(item);
        }
      }
    } catch {}
  }

  // B. 若当前处于作业/题目详情页（如 fileUploadList.jsp 或 programList.jsp），自动捕获当前作业并存入数据库
  try {
    const urlMatch = window.location.href.match(/assignID=([a-zA-Z0-9_-]+)/i);
    if (urlMatch) {
      const curAssignId = urlMatch[1];
      const curDetail = parseAssignmentDetailHtml(document.documentElement.innerHTML);

      // 提取标题：优先面包屑、h3/h4/b 或通用结构
      let title = curDetail.title;
      if (!title) {
        const titleEl = document.querySelector('.breadcrumb li:last-child, .breadcrumb li.active, h4, h5, b');
        if (titleEl) title = titleEl.textContent?.trim();
      }
      title = title || `作业 ${curAssignId}`;

      const item: Assignment = {
        id: curAssignId,
        courseName: '当前课程',
        title,
        deadline: curDetail.deadline || '未设截止时间',
        deadlineTimestamp: curDetail.deadlineTimestamp,
        remainingHours: curDetail.remainingHours,
        remainingText: curDetail.remainingText,
        status: 'pending',
        urgency: curDetail.remainingHours <= 6 ? 'critical' : curDetail.remainingHours <= 24 ? 'urgent' : 'normal',
        url: window.location.pathname + window.location.search
      };

      if (client.db) {
        await client.db.upsertAssignment(item);
      }

      const existingIdx = pendingList.findIndex(a => a.id === curAssignId);
      if (existingIdx !== -1) {
        pendingList[existingIdx] = { ...pendingList[existingIdx], ...item };
      } else {
        pendingList.unshift(item);
        seenIds.add(curAssignId);
      }
    }
  } catch {}

  // C. 从当前页面 DOM 提取侧边栏中的当前作业，自动沉淀至数据库
  try {
    const domAssigns = parseActiveAssignmentsHtml(document.documentElement.innerHTML, '当前课程');
    for (const item of domAssigns) {
      if (client.db) {
        await client.db.upsertAssignment(item);
      }
      const existingIdx = pendingList.findIndex(a => a.id === item.id);
      if (existingIdx !== -1) {
        pendingList[existingIdx] = { ...pendingList[existingIdx], ...item };
      } else {
        pendingList.push(item);
        seenIds.add(item.id);
      }
    }
  } catch {}

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
    const hoursThreshold = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);
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
