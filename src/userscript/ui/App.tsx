import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Assignment, PushConfig, SubmissionResult } from '../../core/types';
import { CourseGradingClient } from '../../core/client';
import { BrowserStorage } from '../browser-adapter';
import { createDeadlineCalendar } from './calendar';

interface AppProps {
  client: CourseGradingClient;
  storage: BrowserStorage;
  initialAssignments: Assignment[];
}

export function App({ client, storage, initialAssignments }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'homework' | 'settings' | 'eval'>('homework');
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'active' | 'overdue' | 'all'>('active');

  // Push & Alert Config State
  const [pushplusToken, setPushplusToken] = useState('');
  const [barkUrl, setBarkUrl] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsWebhookUrl, setSmsWebhookUrl] = useState('');
  const [threshold, setThreshold] = useState(72);

  // Submissions State
  const [submissions, setSubmissions] = useState<SubmissionResult[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (async () => {
      const token = (await storage.get('nodd_pushplus_token')) || '';
      const bark = (await storage.get('nodd_bark_url')) || '';
      const phone = (await storage.get('nodd_sms_phone')) || '';
      const smsUrl = (await storage.get('nodd_sms_webhook_url')) || '';
      const th = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);
      setPushplusToken(token);
      setBarkUrl(bark);
      setSmsPhone(phone);
      setSmsWebhookUrl(smsUrl);
      setThreshold(th);
    })();
  }, []);

  // 刷新当前课程作业
  const refreshAssignments = async () => {
    setLoading(true);
    try {
      const list = await client.getPendingAssignments(threshold);
      setAssignments(list);
      showToast(`已刷新：发现 ${list.length} 项作业`);
    } catch {
      showToast('获取作业列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 一键全量同步所有课程（带安全 Session 恢复）
  const syncAllCourses = async () => {
    setLoading(true);
    showToast('正在全量安全同步所有课程...');
    try {
      const curMatch = document.documentElement.innerHTML.match(/courselist\.jsp\?courseID=([a-zA-Z0-9_-]+)/i) ||
                       window.location.search.match(/courseID=([a-zA-Z0-9_-]+)/i);
      const curId = curMatch ? curMatch[1] : undefined;

      const list = await client.safeSyncAllCourses(curId, (msg) => showToast(msg));
      setAssignments(list);
      showToast(`同步完成！共汇总 ${list.length} 项作业`);
    } catch {
      showToast('同步全部课程失败');
    } finally {
      setLoading(false);
    }
  };

  // 刷新评测记录
  const refreshSubmissions = async () => {
    setEvalLoading(true);
    try {
      const subs = await client.getLatestSubmissions();
      setSubmissions(subs);
    } catch {
      showToast('获取评测历史失败');
    } finally {
      setEvalLoading(false);
    }
  };

  const savePushConfig = async () => {
    await storage.set('nodd_pushplus_token', pushplusToken.trim());
    await storage.set('nodd_bark_url', barkUrl.trim());
    await storage.set('nodd_sms_phone', smsPhone.trim());
    await storage.set('nodd_sms_webhook_url', smsWebhookUrl.trim());
    await storage.set('nodd_hours_threshold', String(threshold));
    showToast('推送与提醒配置已保存！');
  };

  const testPush = async () => {
    if (!pushplusToken && !barkUrl && !smsWebhookUrl) {
      showToast('请先配置至少一种提醒方式（微信 / Bark / 短信）');
      return;
    }
    showToast('正在发送测试推送...');
    const res = await client.triggerPushAlert({
      pushplusToken,
      barkUrl,
      smsPhone,
      smsWebhookUrl,
      hoursThreshold: threshold
    });
    if (res.sent) {
      showToast(`测试成功！已向设置渠道发送 ${res.count} 项即将到期作业提醒`);
    } else {
      showToast(`推送失败: ${res.error || '无即将截止作业或网络错误'}`);
    }
  };

  const exportCalendar = () => {
    const calendar = createDeadlineCalendar(assignments, window.location.origin);
    if (!calendar) {
      showToast('当前没有可导出的未截止作业');
      return;
    }

    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'NoDDL-deadlines.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast('日历文件已导出');
  };

  const activeCount = assignments.filter((a) => a.remainingHours > 0).length;
  const overdueCount = assignments.filter((a) => a.remainingHours <= 0).length;
  const urgentCount = assignments.filter((a) => a.remainingHours > 0 && (a.urgency === 'critical' || a.urgency === 'urgent')).length;

  const filteredAssignments = assignments.filter((item) => {
    if (filter === 'active') return item.remainingHours > 0;
    if (filter === 'overdue') return item.remainingHours <= 0;
    return true;
  });

  return (
    <div>
      {/* 悬浮球 Trigger */}
      <div className="nodd-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="logo-badge">NoDDL</span>
        {urgentCount > 0 ? (
          <span className="counter">{urgentCount}</span>
        ) : activeCount > 0 ? (
          <span className="counter" style="background:#3b82f6;">{activeCount}</span>
        ) : null}
      </div>

      {/* 主控制面板 */}
      {isOpen && (
        <div className="nodd-panel-wrapper">
          {toast && <div className="nodd-toast">{toast}</div>}

          {/* 头部 */}
          <div className="nodd-header">
            <div className="nodd-header-title">
              <span>🚀 NoDDL 控制台</span>
            </div>
            <div className="nodd-header-actions">
              <button
                className="btn btn-sm btn-secondary"
                style="font-size:11px;padding:3px 8px;font-weight:600;"
                title="全量扫描并同步所有课程作业"
                onClick={syncAllCourses}
              >
                🌐 同步全部课程
              </button>
              <button
                className="icon-btn"
                title="刷新数据"
                onClick={() => {
                  if (activeTab === 'homework') refreshAssignments();
                  if (activeTab === 'eval') refreshSubmissions();
                }}
              >
                🔄
              </button>
              <button className="icon-btn" title="关闭面板" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>
          </div>

          {/* 选项卡导航 */}
          <div className="nodd-tabs">
            <div
              className={`nodd-tab-item ${activeTab === 'homework' ? 'active' : ''}`}
              onClick={() => setActiveTab('homework')}
            >
              📋 DDL 看板 ({assignments.length})
            </div>
            <div
              className={`nodd-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ 推送与提醒
            </div>
            <div
              className={`nodd-tab-item ${activeTab === 'eval' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('eval');
                refreshSubmissions();
              }}
            >
              📊 评测状态
            </div>
          </div>

          {/* 内容区 */}
          <div className="nodd-content">
            {/* Tab 1: DDL 看板 */}
            {activeTab === 'homework' && (
              <div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                  <button
                    className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('active')}
                  >
                    进行中 ({activeCount})
                  </button>
                  <button
                    className={`btn btn-sm ${filter === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('overdue')}
                  >
                    已超期 ({overdueCount})
                  </button>
                  <button
                    className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('all')}
                  >
                    全部 ({assignments.length})
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={exportCalendar}>
                    导出日历
                  </button>
                </div>

                {loading ? (
                  <div className="empty-state">正在同步作业数据...</div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="empty-state">
                    <span style="font-size:24px;">🎉</span>
                    <span>当前分类下没有作业</span>
                  </div>
                ) : (
                  <div style="display:flex;flex-direction:column;gap:8px;">
                    {filteredAssignments.map((hw) => {
                      const badgeClass =
                        hw.remainingHours <= 0
                          ? 'badge-critical'
                          : hw.urgency === 'critical'
                          ? 'badge-critical'
                          : hw.urgency === 'urgent'
                          ? 'badge-urgent'
                          : hw.urgency === 'warning'
                          ? 'badge-warning'
                          : 'badge-normal';

                      return (
                        <div className="nodd-card" key={hw.id}>
                          <div className="card-header">
                            <div>
                              <div className="card-title">{hw.title}</div>
                              <div className="card-course">{hw.courseName}</div>
                            </div>
                            <span className={`badge ${badgeClass}`}>{hw.remainingText}</span>
                          </div>
                          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                            <span style="font-size:12px;color:var(--text-sub);">
                              DDL: {hw.deadline}
                            </span>
                            {hw.url && (
                              <a
                                href={hw.url.startsWith('http') ? hw.url : `${window.location.origin}${hw.url.startsWith('/') ? '' : '/'}${hw.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style="font-size:12px;color:var(--primary);text-decoration:none;font-weight:600;"
                              >
                                前往作答 →
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: 消息与短信提醒配置 */}
            {activeTab === 'settings' && (
              <div style="display:flex;flex-direction:column;gap:14px;">
                {/* 1. PushPlus 微信推送 */}
                <div className="form-group">
                  <label className="form-label">微信推送 (PushPlus)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="PushPlus Token"
                    value={pushplusToken}
                    onInput={(e) => setPushplusToken((e.target as HTMLInputElement).value)}
                  />
                </div>

                {/* 2. 短信提醒 (SMS) */}
                <details className="form-group">
                  <summary className="form-label" style="cursor:pointer;">短信网关 (高级，可选)</summary>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="接收短信的手机号"
                    value={smsPhone}
                    onInput={(e) => setSmsPhone((e.target as HTMLInputElement).value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="短信网关 Webhook 地址"
                    value={smsWebhookUrl}
                    onInput={(e) => setSmsWebhookUrl((e.target as HTMLInputElement).value)}
                  />
                </details>

                {/* 3. Bark 苹果设备推送 */}
                <div className="form-group">
                  <label className="form-label">苹果设备推送 (Bark)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Bark 推送 URL"
                    value={barkUrl}
                    onInput={(e) => setBarkUrl((e.target as HTMLInputElement).value)}
                  />
                </div>

                {/* 4. 提醒时间提前量 */}
                <div className="form-group">
                  <label className="form-label">DDL 提醒提前量</label>
                  <select
                    className="form-input"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt((e.target as HTMLSelectElement).value, 10))}
                  >
                    <option value={24}>截止前 24 小时以内 (极紧急)</option>
                    <option value={48}>截止前 48 小时以内 (2天)</option>
                    <option value={72}>截止前 72 小时以内 (3天)</option>
                    <option value={168}>截止前 168 小时以内 (1周)</option>
                  </select>
                </div>

                <div style="display:flex;gap:8px;margin-top:8px;">
                  <button className="btn btn-primary" style="flex:1;" onClick={savePushConfig}>
                    💾 保存配置
                  </button>
                  <button className="btn btn-secondary" onClick={testPush}>
                    🔔 发送测试提醒
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: 评测状态 */}
            {activeTab === 'eval' && (
              <div>
                {evalLoading ? (
                  <div className="empty-state">正在查询最新评测结果...</div>
                ) : submissions.length === 0 ? (
                  <div className="empty-state">
                    <span>暂无评测记录或页面未开放评测列表</span>
                  </div>
                ) : (
                  <div style="display:flex;flex-direction:column;gap:8px;">
                    {submissions.map((sub) => (
                      <div className="nodd-card" key={sub.id}>
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                          <span style="font-weight:600;font-size:13px;">提交 #{sub.id}</span>
                          <span
                            className={`badge ${
                              sub.status === 'Accepted'
                                ? 'badge-normal'
                                : sub.status === 'Judging'
                                ? 'badge-warning'
                                : 'badge-critical'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <div style="font-size:12px;color:var(--text-sub);">
                          提交时间：{sub.submitTime}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
