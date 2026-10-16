import { CourseGradingClient } from '../core/client';
import { parseActiveAssignmentsHtml, parseAssignmentDetailHtml, parseActiveCourseInfo, parseExperimentAssignmentsHtml } from '../core/parsers';
import { calculateUrgency } from '../core/time';
import { BrowserHttpClient, BrowserStorage } from './browser-adapter';
import { mountNoDDLUI } from './ui/mount';
import { setupTestCaseCopyButtons, setupCodeAutoSave } from './ui/helpers';
import { PushConfig, Assignment } from '../core/types';
import { callEmailApi, getServiceConfig } from './email-api';
import { parseExperimentDeadlineFromDom } from './experiment-dom';

const storage = new BrowserStorage();
const http = new BrowserHttpClient();
const client = new CourseGradingClient({ baseUrl: window.location.origin }, http, storage);

async function initNoDDL() {
  if (window.top !== window.self) return;

  console.log('[NoDDL] 启动希冀平台原生解析适配');

  // 1. 注入辅助增强：复制测试用例 & 代码自动本地暂存
  setupTestCaseCopyButtons();
  setupCodeAutoSave();

  // 2. 识别当前页面激活课程
  const activeCourse = parseActiveCourseInfo(document.documentElement.innerHTML);
  const curUrlCourseM = window.location.search.match(/courseID=([a-zA-Z0-9_-]+)/i);
  const currentCourseId = curUrlCourseM ? curUrlCourseM[1] : (activeCourse.id || '');
  const currentCourseName = activeCourse.name || '';

  if (client.db && currentCourseId && currentCourseName) {
    await client.db.upsertCourse(currentCourseId, currentCourseName);
  }

  // 3. 提取侧边栏当前进行中的作业，并补齐精确 DDL
  const domAssigns = parseActiveAssignmentsHtml(
    document.documentElement.innerHTML,
    currentCourseName,
    currentCourseId
  );
  for (const item of domAssigns) {
    if (item.deadlineTimestamp === 0) {
      const detailUrl = `${window.location.origin}${item.url}`;
      const detail = parseAssignmentDetailHtml(await http.get(detailUrl));
      if (detail.deadlineTimestamp === 0) {
        throw new Error(`作业 ${item.id} 缺少真实截止时间`);
      }
      item.deadline = detail.deadline!;
      item.deadlineTimestamp = detail.deadlineTimestamp;
      item.remainingHours = detail.remainingHours;
      item.remainingText = detail.remainingText;
      item.urgency = calculateUrgency(detail.remainingHours);
    }

    if (client.db) {
      await client.db.upsertAssignment(item);
    }
  }

  for (const item of parseExperimentAssignmentsHtml(document.documentElement.innerHTML, currentCourseId, currentCourseName)) {
    if (client.db) await client.db.upsertAssignment(item);
  }

  // 4. 若当前处于作业/题目提交页（如 fileUploadList.jsp 或 programList.jsp）
  const urlMatch = window.location.href.match(/assignID=([a-zA-Z0-9_-]+)/i);
  if (urlMatch) {
      const curAssignId = urlMatch[1];
      const isExperimentPage = window.location.pathname.startsWith('/exp/');
      const experimentAssignment = isExperimentPage
        ? (() => {
            const activeLink = document.querySelector<HTMLAnchorElement>('a.list-group-item.active');
            const title = activeLink?.textContent?.replace(/\s+/g, ' ').trim();
            const deadline = parseExperimentDeadlineFromDom(document);
            if (!title || !deadline) return undefined;
            return {
              id: curAssignId,
              courseId: currentCourseId,
              courseName: currentCourseName || '云实验',
              title,
              deadline: deadline.normalized,
              deadlineTimestamp: deadline.timestamp,
              remainingHours: deadline.remainingHours,
              remainingText: deadline.remainingText,
              status: 'pending' as const,
              urgency: deadline.urgency,
              url: `/exp/index.jsp?assignID=${curAssignId}`
            };
          })()
        : undefined;
      let curDetail = isExperimentPage
        ? experimentAssignment
          ? {
              title: experimentAssignment.title,
              deadline: experimentAssignment.deadline,
              deadlineTimestamp: experimentAssignment.deadlineTimestamp,
              remainingHours: experimentAssignment.remainingHours,
              remainingText: experimentAssignment.remainingText,
              status: experimentAssignment.status
            }
          : { title: undefined, deadline: undefined, deadlineTimestamp: 0, remainingHours: 0, remainingText: '待定', status: 'pending' as const }
        : parseAssignmentDetailHtml(document.documentElement.innerHTML);

      // 云实验页直接从当前 DOM 的截止字段读取，不请求作业模块页面。
      if (isExperimentPage) {
        if (!experimentAssignment) throw new Error(`云实验 ${curAssignId} 缺少真实作业信息`);
        curDetail = experimentAssignment;
      } else if (curDetail.deadlineTimestamp === 0) {
        // 普通作业页未展示起止时间时，抓取作业主卡片。
        const mainUrl = currentCourseId
          ? `${window.location.origin}/assignment/index.jsp?courseID=${currentCourseId}&assignID=${curAssignId}`
          : `${window.location.origin}/assignment/index.jsp?assignID=${curAssignId}`;
        const fetchedDetail = parseAssignmentDetailHtml(await http.get(mainUrl));
        if (fetchedDetail.deadlineTimestamp === 0) {
          throw new Error(`作业 ${curAssignId} 缺少真实截止时间`);
        }
        curDetail = fetchedDetail;
      }

      let title = curDetail.title;
      if (!title) {
        const bc = document.querySelector('.breadcrumb li a, .breadcrumb li:first-child');
        if (bc) title = bc.textContent?.trim();
      }
      if (!title) throw new Error(`作业 ${curAssignId} 缺少真实标题`);

      const finalUrl = isExperimentPage
        ? experimentAssignment?.url || `${window.location.pathname}${window.location.search}`
        : currentCourseId
          ? `/assignment/index.jsp?courseID=${currentCourseId}&assignID=${curAssignId}`
          : `/assignment/index.jsp?assignID=${curAssignId}`;

      const item: Assignment = {
        id: curAssignId,
        courseId: isExperimentPage ? '' : currentCourseId,
        courseName: isExperimentPage ? '云实验' : currentCourseName,
        title,
        deadline: curDetail.deadline || '',
        deadlineTimestamp: curDetail.deadlineTimestamp,
        remainingHours: curDetail.remainingHours,
        remainingText: curDetail.remainingText,
        status: curDetail.status,
        urgency: calculateUrgency(curDetail.remainingHours),
        url: finalUrl
      };

      if (client.db) {
        await client.db.upsertAssignment(item);
      }
  }

  // 5. 从归一化数据库读取全部作业（统一去重与排序）
  const allAssignments = client.db ? await client.db.getAllAssignments() : [];

  // 6. 挂载右下角独立悬浮控制面板 (Shadow DOM 隔离)
  mountNoDDLUI(client, storage, allAssignments, http);

  // 7. 针对即将到期作业进行通知
  if (allAssignments.length > 0) {
    const mostUrgent = allAssignments.find(a => a.remainingHours > 0 && (a.urgency === 'critical' || a.urgency === 'urgent'));
    const pushplusToken = (await storage.get('nodd_pushplus_token')) || '';
    const barkUrl = (await storage.get('nodd_bark_url')) || '';
    const smsWebhookUrl = (await storage.get('nodd_sms_webhook_url')) || '';
    const smsPhone = (await storage.get('nodd_sms_phone')) || '';
    const hoursThreshold = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);
    const pushConfig: PushConfig = {
      pushplusToken,
      barkUrl,
      smsWebhookUrl,
      smsPhone,
      hoursThreshold
    };
    if (pushplusToken || barkUrl || smsWebhookUrl) {
      client.triggerPushAlert(pushConfig).catch(console.error);
    }

    const service = await getServiceConfig(storage);
    const emailToken = (await service.storage.get('nodd_email_token')) || '';
    if (emailToken && service.baseUrl) {
      const dueSoon = allAssignments.filter(item =>
        item.deadlineTimestamp > Date.now() && item.remainingHours <= hoursThreshold
      );
      if (dueSoon.length > 0) {
        callEmailApi(http, service.baseUrl, 'alert', { assignments: dueSoon }, emailToken).catch(console.error);
      }
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNoDDL);
} else {
  initNoDDL();
}
