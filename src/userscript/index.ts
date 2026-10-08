import { CourseGradingClient } from '../core/client';
import { parseActiveAssignmentsHtml } from '../core/parsers';
import { BrowserHttpClient, BrowserStorage } from './browser-adapter';
import { mountNoDDLUI, setupTestCaseCopyButtons, setupCodeAutoSave } from './ui';
import { PushConfig, Assignment } from '../core/types';

const storage = new BrowserStorage();
const http = new BrowserHttpClient();
const client = new CourseGradingClient({ baseUrl: window.location.origin }, http);

async function initNoDDL() {
  console.log('[NoDDL] 启动悬浮控制面板 (无侵入模式)');

  // 1. 注入辅助功能：复制测试用例 & 代码自动暂存
  setupTestCaseCopyButtons();
  setupCodeAutoSave();

  // 2. 读取配置
  const hoursThreshold = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);
  let pendingList: Assignment[] = [];

  // 优先从当前页面 DOM 提取（如处于 /main.jsp 或 /assignment/mainActiveAssigns.jsp）
  try {
    const domAssigns = parseActiveAssignmentsHtml(document.body.innerHTML, '当前课程');
    if (domAssigns.length > 0) {
      pendingList = domAssigns;
    }
  } catch {}

  // 调用原生接口获取所有修读课程作业
  try {
    const apiAssigns = await client.getPendingAssignments(hoursThreshold);
    if (apiAssigns.length > 0) {
      pendingList = apiAssigns;
    }
  } catch (err) {
    console.warn('[NoDDL] 接口拉取作业列表异常:', err);
  }

  // 3. 挂载右下角 Preact 悬浮球与控制面板 (Shadow DOM 隔离，无顶部 Header 侵入)
  mountNoDDLUI(client, storage, pendingList);

  // 4. 仅在有紧急作业时触发桌面通知与远程推送
  if (pendingList.length > 0) {
    const mostUrgent = pendingList[0];
    if (mostUrgent.urgency === 'critical' || mostUrgent.urgency === 'urgent') {
      if (typeof GM_notification !== 'undefined') {
        GM_notification({
          title: '🚨 NoDDL 待交作业提醒',
          text: `【${mostUrgent.courseName}】${mostUrgent.title} ${mostUrgent.remainingText}，请尽快提交！`,
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
