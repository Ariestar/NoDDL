import { CourseGradingClient } from '../core/client';
import { BrowserHttpClient, BrowserStorage } from './browser-adapter';
import { mountNoDDLUI, renderUrgentBanner, setupTestCaseCopyButtons, setupCodeAutoSave } from './ui';
import { PushConfig } from '../core/types';

const storage = new BrowserStorage();
const http = new BrowserHttpClient();
const client = new CourseGradingClient({ baseUrl: window.location.origin }, http);

async function initNoDDL() {
  console.log('[NoDDL] 现代化交互界面已启动');

  // 1. 注入辅助功能：复制测试用例 & 代码自动暂存
  setupTestCaseCopyButtons();
  setupCodeAutoSave();

  // 2. 读取配置并拉取未交作业
  const hoursThreshold = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);
  let pendingList: any[] = [];

  try {
    pendingList = await client.getPendingAssignments(hoursThreshold);
  } catch (err) {
    console.warn('[NoDDL] 拉取作业列表异常:', err);
  }

  // 3. 挂载 Preact 现代控制面板 (Shadow DOM 隔离)
  mountNoDDLUI(client, storage, pendingList);

  // 4. 若有作业，同时渲染顶部倒计时横幅与系统弹窗
  if (pendingList.length > 0) {
    renderUrgentBanner(pendingList, () => {
      // 点击横幅触发呼出控制面板
      const trigger = document
        .getElementById('nodd-shadow-root')
        ?.shadowRoot?.querySelector('.nodd-trigger') as HTMLElement | null;
      trigger?.click();
    });

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

    // 远程消息推送
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
