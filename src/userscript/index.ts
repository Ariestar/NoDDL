import { CourseGradingClient } from '../core/client';
import { parseActiveAssignmentsHtml, parseAssignmentDetailHtml, parseActiveCourseInfo } from '../core/parsers';
import { BrowserHttpClient, BrowserStorage } from './browser-adapter';
import { mountNoDDLUI, setupTestCaseCopyButtons, setupCodeAutoSave } from './ui';
import { PushConfig, Assignment } from '../core/types';

const storage = new BrowserStorage();
const http = new BrowserHttpClient();
const client = new CourseGradingClient({ baseUrl: window.location.origin }, http, storage);

async function initNoDDL() {
  console.log('[NoDDL] 启动希冀平台原生解析适配');

  // 1. 注入辅助增强：复制测试用例 & 代码自动本地暂存
  setupTestCaseCopyButtons();
  setupCodeAutoSave();

  const seenIds = new Set<string>();
  const pendingList: Assignment[] = [];

  // 获取当前页面激活的课程名称（如 "离散数学"）
  const activeCourse = parseActiveCourseInfo(document.documentElement.innerHTML);
  const currentCourseName = activeCourse.name || '当前课程';

  // A. 从本地持久化数据库加载全部已缓存课程的作业（跨课程多维汇聚）
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

  // B. 当前页面 DOM 提取侧边栏当前进行中的作业（希冀原生结构: fas fa-clock 下的 list-group）
  try {
    const domAssigns = parseActiveAssignmentsHtml(document.documentElement.innerHTML, currentCourseName);
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

  // C. 若当前处于作业/题目提交页（如 fileUploadList.jsp?proNum=1&assignID=3548 或 programList.jsp）
  try {
    const urlMatch = window.location.href.match(/assignID=([a-zA-Z0-9_-]+)/i);
    if (urlMatch) {
      const curAssignId = urlMatch[1];
      let curDetail = parseAssignmentDetailHtml(document.documentElement.innerHTML);

      // 若当前题目页未带 DDL，通过同源只读请求拉取对应作业主页获取卡片时间 (index.jsp?assignID=xxx)
      if (!curDetail.deadline) {
        try {
          const mainAssignHtml = await http.get(`${window.location.origin}/assignment/index.jsp?assignID=${curAssignId}`);
          const fetchedDetail = parseAssignmentDetailHtml(mainAssignHtml);
          if (fetchedDetail.deadline) {
            curDetail = fetchedDetail;
          }
        } catch {}
      }

      // 提取标题：优先面包屑首项、卡片 h4、或标题
      let title = curDetail.title;
      if (!title) {
        const bc = document.querySelector('.breadcrumb li a, .breadcrumb li:first-child');
        if (bc) title = bc.textContent?.trim();
      }
      title = title || `作业 ${curAssignId}`;

      const item: Assignment = {
        id: curAssignId,
        courseName: currentCourseName,
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
