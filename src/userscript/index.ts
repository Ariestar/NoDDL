import { CourseGradingClient } from '../core/client';
import { parseActiveAssignmentsHtml, parseAssignmentDetailHtml, parseActiveCourseInfo } from '../core/parsers';
import { calculateUrgency } from '../core/time';
import { BrowserHttpClient, BrowserStorage } from './browser-adapter';
import { mountNoDDLUI, setupTestCaseCopyButtons, setupCodeAutoSave } from './ui';
import { PushConfig, Assignment } from '../core/types';
import { EMAIL_API_BASE_URL, callEmailApi } from './email-api';
import { parseExperimentDeadlineFromDom } from './experiment-dom';

const storage = new BrowserStorage();
const http = new BrowserHttpClient();
const client = new CourseGradingClient({ baseUrl: window.location.origin }, http, storage);

async function initNoDDL() {
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
  try {
    const domAssigns = parseActiveAssignmentsHtml(
      document.documentElement.innerHTML,
      currentCourseName,
      currentCourseId
    );
    for (const item of domAssigns) {
      if (item.deadlineTimestamp === 0) {
        try {
          const detailUrl = `${window.location.origin}${item.url}`;
          const detailHtml = await http.get(detailUrl);
          const detail = parseAssignmentDetailHtml(detailHtml);
          if (detail.deadlineTimestamp > 0) {
            item.deadline = detail.deadline!;
            item.deadlineTimestamp = detail.deadlineTimestamp;
            item.remainingHours = detail.remainingHours;
            item.remainingText = detail.remainingText;
            item.urgency = calculateUrgency(detail.remainingHours);
          }
        } catch {}
      }

      if (client.db) {
        await client.db.upsertAssignment(item);
      }
    }
  } catch {}

  // 4. 若当前处于作业/题目提交页（如 fileUploadList.jsp 或 programList.jsp）
  try {
    const urlMatch = window.location.href.match(/assignID=([a-zA-Z0-9_-]+)/i);
    if (urlMatch) {
      const curAssignId = urlMatch[1];
      const isExperimentPage = window.location.pathname.startsWith('/exp/');
      let curDetail = isExperimentPage
        ? { deadlineTimestamp: 0, remainingHours: 9999, remainingText: '待定' }
        : parseAssignmentDetailHtml(document.documentElement.innerHTML);

      // 云实验页直接从当前 DOM 的截止字段读取，不请求作业模块页面。
      if (isExperimentPage) {
        const experimentDeadline = parseExperimentDeadlineFromDom(document);
        if (experimentDeadline) {
          curDetail = {
            ...curDetail,
            deadline: experimentDeadline.normalized,
            deadlineTimestamp: experimentDeadline.timestamp,
            remainingHours: experimentDeadline.remainingHours,
            remainingText: experimentDeadline.remainingText
          };
        }
      } else if (curDetail.deadlineTimestamp === 0) {
        // 普通作业页未展示起止时间时，抓取作业主卡片。
        try {
          const mainUrl = currentCourseId
            ? `${window.location.origin}/assignment/index.jsp?courseID=${currentCourseId}&assignID=${curAssignId}`
            : `${window.location.origin}/assignment/index.jsp?assignID=${curAssignId}`;
          const mainAssignHtml = await http.get(mainUrl);
          const fetchedDetail = parseAssignmentDetailHtml(mainAssignHtml);
          if (fetchedDetail.deadlineTimestamp > 0) {
            curDetail = fetchedDetail;
          }
        } catch {}
      }

      let title = curDetail.title;
      if (!title) {
        const bc = document.querySelector('.breadcrumb li a, .breadcrumb li:first-child');
        if (bc) title = bc.textContent?.trim();
      }
      title = title || `作业 ${curAssignId}`;

      const finalUrl = isExperimentPage
        ? `${window.location.pathname}${window.location.search}`
        : currentCourseId
          ? `/assignment/index.jsp?courseID=${currentCourseId}&assignID=${curAssignId}`
          : `/assignment/index.jsp?assignID=${curAssignId}`;

      const item: Assignment = {
        id: curAssignId,
        courseId: isExperimentPage ? '' : currentCourseId,
        courseName: isExperimentPage ? '云实验' : currentCourseName,
        title,
        deadline: curDetail.deadline || '未设截止时间',
        deadlineTimestamp: curDetail.deadlineTimestamp,
        remainingHours: curDetail.remainingHours,
        remainingText: curDetail.remainingText,
        status: 'pending',
        urgency: calculateUrgency(curDetail.remainingHours),
        url: finalUrl
      };

      if (client.db) {
        await client.db.upsertAssignment(item);
      }
    }
  } catch {}

  // 5. 从归一化数据库读取全部作业（统一去重与排序）
  const allAssignments = client.db ? await client.db.getAllAssignments() : [];

  // 6. 挂载右下角独立悬浮控制面板 (Shadow DOM 隔离)
  mountNoDDLUI(client, storage, allAssignments, http);

  // 7. 针对即将到期作业进行通知
  if (allAssignments.length > 0) {
    const mostUrgent = allAssignments.find(a => a.remainingHours > 0 && (a.urgency === 'critical' || a.urgency === 'urgent'));
    if (mostUrgent && typeof GM_notification !== 'undefined') {
      GM_notification({
        title: '🚨 NoDDL DDL 提醒',
        text: `【${mostUrgent.courseName}】${mostUrgent.title} ${mostUrgent.remainingText}，请尽快完成！`,
        timeout: 8000
      });
    }

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

    const emailToken = (await storage.get('nodd_email_token')) || '';
    if (emailToken && EMAIL_API_BASE_URL) {
      const dueSoon = allAssignments.filter(item =>
        item.status === 'pending' && item.deadlineTimestamp > Date.now() && item.remainingHours <= hoursThreshold
      );
      if (dueSoon.length > 0) {
        callEmailApi(http, 'alert', { assignments: dueSoon }, emailToken).catch(console.error);
      }
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNoDDL);
} else {
  initNoDDL();
}
