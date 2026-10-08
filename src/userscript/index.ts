import { CourseGradingClient } from '../core/client';
import { BrowserHttpClient, BrowserStorage } from './browser-adapter';
import { renderUrgentBanner, setupTestCaseCopyButtons, setupCodeAutoSave } from './ui';
import { PushConfig } from '../core/types';

const storage = new BrowserStorage();
const http = new BrowserHttpClient();
const client = new CourseGradingClient({ baseUrl: window.location.origin }, http);

async function initNoDDL() {
  console.log('[NoDDL] 平台增强脚本已加载');

  setupTestCaseCopyButtons();
  setupCodeAutoSave();

  const pushplusToken = (await storage.get('nodd_pushplus_token')) || '';
  const barkUrl = (await storage.get('nodd_bark_url')) || '';
  const hoursThreshold = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);

  try {
    const pending = await client.getPendingAssignments(hoursThreshold);
    if (pending.length > 0) {
      renderUrgentBanner(pending, showConfigDialog);

      const mostUrgent = pending[0];
      if (mostUrgent.urgency === 'critical' || mostUrgent.urgency === 'urgent') {
        if (typeof GM_notification !== 'undefined') {
          GM_notification({
            title: '🚨 NoDDL 待交作业提醒',
            text: `【${mostUrgent.courseName}】${mostUrgent.title} ${mostUrgent.remainingText}，请尽快提交！`,
            timeout: 8000
          });
        }
      }

      const pushConfig: PushConfig = {
        pushplusToken,
        barkUrl,
        hoursThreshold
      };
      if (pushplusToken || barkUrl) {
        client.triggerPushAlert(pushConfig).catch(console.error);
      }
    }
  } catch (err) {
    console.warn('[NoDDL] 获取作业列表失败:', err);
  }
}

async function showConfigDialog() {
  const currentToken = (await storage.get('nodd_pushplus_token')) || '';
  const currentBark = (await storage.get('nodd_bark_url')) || '';

  const newToken = prompt('请输入 PushPlus Token (微信推送，留空表示不开启):', currentToken);
  if (newToken !== null) {
    await storage.set('nodd_pushplus_token', newToken.trim());
  }

  const newBark = prompt('请输入 Bark 推送 URL (iOS系统通知，例如 https://api.day.app/YOUR_KEY):', currentBark);
  if (newBark !== null) {
    await storage.set('nodd_bark_url', newBark.trim());
  }

  alert('NoDDL 配置已保存！');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNoDDL);
} else {
  initNoDDL();
}
