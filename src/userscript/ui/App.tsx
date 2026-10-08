import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Assignment, PushConfig, SubmissionResult } from '../../core/types';
import { CourseGradingClient } from '../../core/client';
import { BrowserStorage } from '../browser-adapter';

interface AppProps {
  client: CourseGradingClient;
  storage: BrowserStorage;
  initialAssignments: Assignment[];
}

export function App({ client, storage, initialAssignments }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'homework' | 'settings' | 'toolbox' | 'eval'>('homework');
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'urgent'>('pending');

  // Push Config State
  const [pushplusToken, setPushplusToken] = useState('');
  const [barkUrl, setBarkUrl] = useState('');
  const [threshold, setThreshold] = useState(72);

  // Submissions State
  const [submissions, setSubmissions] = useState<SubmissionResult[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);

  // Code drafts State
  const [drafts, setDrafts] = useState<{ key: string; time: string; length: number; code: string }[]>([]);

  // Toast State
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // 初始化加载配置
  useEffect(() => {
    (async () => {
      const token = (await storage.get('nodd_pushplus_token')) || '';
      const bark = (await storage.get('nodd_bark_url')) || '';
      const th = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);
      setPushplusToken(token);
      setBarkUrl(bark);
      setThreshold(th);
    })();
  }, []);

  // 刷新作业列表
  const refreshAssignments = async () => {
    setLoading(true);
    try {
      const list = await client.getPendingAssignments(threshold);
      setAssignments(list);
      showToast(`已刷新：发现 ${list.length} 项待完成任务`);
    } catch {
      showToast('获取作业列表失败');
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

  // 加载本地草稿历史
  const loadDrafts = () => {
    const list: { key: string; time: string; length: number; code: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nodd_autosave_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.code) {
            list.push({
              key,
              time: item.time || '未知时间',
              length: item.code.length,
              code: item.code
            });
          }
        } catch {}
      }
    }
    setDrafts(list);
  };

  // 保存推送配置
  const savePushConfig = async () => {
    await storage.set('nodd_pushplus_token', pushplusToken.trim());
    await storage.set('nodd_bark_url', barkUrl.trim());
    await storage.set('nodd_hours_threshold', String(threshold));
    showToast('推送配置已保存！');
  };

  // 发送测试推送
  const testPush = async () => {
    if (!pushplusToken && !barkUrl) {
      showToast('请先配置 PushPlus Token 或 Bark URL');
      return;
    }
    showToast('正在发送测试推送...');
    const res = await client.triggerPushAlert({
      pushplusToken,
      barkUrl,
      hoursThreshold: threshold
    });
    if (res.sent) {
      showToast(`测试推送成功！包含 ${res.count} 项作业`);
    } else {
      showToast(`推送失败: ${res.error || '未知原因'}`);
    }
  };

  // 复制 Cookie 凭据
  const copyCookie = () => {
    const cookie = document.cookie;
    if (typeof GM_setClipboard !== 'undefined') {
      GM_setClipboard(cookie);
    } else {
      navigator.clipboard.writeText(cookie);
    }
    showToast('平台 Cookie 凭据已复制到剪贴板！');
  };

  // 过滤作业
  const filteredAssignments = assignments.filter((item) => {
    if (filter === 'urgent') return item.urgency === 'critical' || item.urgency === 'urgent';
    if (filter === 'pending') return item.status === 'pending';
    return true;
  });

  const urgentCount = assignments.filter((a) => a.urgency === 'critical' || a.urgency === 'urgent').length;

  return (
    <div>
      {/* 悬浮球 Trigger */}
      <div className="nodd-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="logo-badge">NoDDL</span>
        {urgentCount > 0 && <span className="counter">{urgentCount}</span>}
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
                className="icon-btn"
                title="刷新数据"
                onClick={() => {
                  if (activeTab === 'homework') refreshAssignments();
                  if (activeTab === 'eval') refreshSubmissions();
                  if (activeTab === 'toolbox') loadDrafts();
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
              📋 死线看板 ({assignments.length})
            </div>
            <div
              className={`nodd-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ 推送配置
            </div>
            <div
              className={`nodd-tab-item ${activeTab === 'toolbox' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('toolbox');
                loadDrafts();
              }}
            >
              🛠️ 实用工具
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
            {/* Tab 1: 死线看板 */}
            {activeTab === 'homework' && (
              <div>
                <div style="display:flex;gap:6px;margin-bottom:12px;">
                  <button
                    className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('pending')}
                  >
                    未提交 ({assignments.filter((a) => a.status === 'pending').length})
                  </button>
                  <button
                    className={`btn btn-sm ${filter === 'urgent' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('urgent')}
                  >
                    即将截止 ({urgentCount})
                  </button>
                  <button
                    className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('all')}
                  >
                    全部
                  </button>
                </div>

                {loading ? (
                  <div className="empty-state">正在拉取作业列表...</div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="empty-state">
                    <span style="font-size:24px;">🎉</span>
                    <span>当前筛选条件下没有待完成的作业</span>
                  </div>
                ) : (
                  <div style="display:flex;flex-direction:column;gap:8px;">
                    {filteredAssignments.map((hw) => {
                      const badgeClass =
                        hw.urgency === 'critical'
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
                              截止：{hw.deadline}
                            </span>
                            {hw.url && (
                              <a
                                href={hw.url}
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

            {/* Tab 2: 消息推送配置 */}
            {activeTab === 'settings' && (
              <div style="display:flex;flex-direction:column;gap:14px;">
                <div className="form-group">
                  <label className="form-label">PushPlus Token (微信推送通知)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="在 pushplus.plus 获取的 Token"
                    value={pushplusToken}
                    onInput={(e) => setPushplusToken((e.target as HTMLInputElement).value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bark URL (iOS 系统横幅通知)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://api.day.app/YOUR_KEY"
                    value={barkUrl}
                    onInput={(e) => setBarkUrl((e.target as HTMLInputElement).value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">死线提醒阈值</label>
                  <select
                    className="form-input"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt((e.target as HTMLSelectElement).value, 10))}
                  >
                    <option value={24}>24 小时以内 (极紧急)</option>
                    <option value={48}>48 小时以内 (2天)</option>
                    <option value={72}>72 小时以内 (3天)</option>
                    <option value={168}>168 小时以内 (1周)</option>
                  </select>
                </div>

                <div style="display:flex;gap:8px;margin-top:8px;">
                  <button className="btn btn-primary" style="flex:1;" onClick={savePushConfig}>
                    💾 保存配置
                  </button>
                  <button className="btn btn-secondary" onClick={testPush}>
                    🔔 发送测试推送
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: 实用工具箱 */}
            {activeTab === 'toolbox' && (
              <div style="display:flex;flex-direction:column;gap:14px;">
                <div className="nodd-card">
                  <div className="card-title">平台会话凭据</div>
                  <div style="font-size:12px;color:var(--text-sub);">
                    一键复制当前登录的 Cookie，供外部脚本或包管理器工具使用。
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={copyCookie}>
                    📋 复制当前 Cookie 到剪贴板
                  </button>
                </div>

                <div className="nodd-card">
                  <div className="card-title">代码暂存草稿箱 ({drafts.length})</div>
                  <div style="font-size:12px;color:var(--text-sub);">
                    本地自动备份的代码记录，误刷新或关闭网页后可随时找回。
                  </div>
                  {drafts.length === 0 ? (
                    <div style="font-size:12px;color:var(--text-sub);padding:8px 0;">
                      暂无暂存记录（在代码编辑框输入时会自动备份）
                    </div>
                  ) : (
                    <div style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-top:6px;">
                      {drafts.map((d) => (
                        <div
                          key={d.key}
                          style="display:flex;justify-content:space-between;align-items:center;background:#f1f5f9;padding:6px 10px;border-radius:6px;font-size:12px;"
                        >
                          <span>🕒 {d.time} ({d.length} 字符)</span>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              if (typeof GM_setClipboard !== 'undefined') {
                                GM_setClipboard(d.code);
                              } else {
                                navigator.clipboard.writeText(d.code);
                              }
                              showToast('已复制草稿代码到剪贴板！');
                            }}
                          >
                            复制
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
