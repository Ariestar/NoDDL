import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Assignment, HttpClient, SubmissionResult } from '../../core/types';
import { CourseGradingClient } from '../../core/client';
import { BrowserStorage } from '../browser-adapter';
import { createDeadlineCalendar } from './calendar';
import { EMAIL_API_BASE_URL, callEmailApi } from '../email-api';
import petImage from './assets/nodd-pet.png';

interface AppProps {
  client: CourseGradingClient;
  storage: BrowserStorage;
  http: HttpClient;
  initialAssignments: Assignment[];
}

export function App({ client, storage, http, initialAssignments }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'homework' | 'settings' | 'eval'>('homework');
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'active' | 'overdue' | 'all'>('active');
  const [sortKey, setSortKey] = useState<'deadline' | 'course'>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Push & Alert Config State
  const [pushplusToken, setPushplusToken] = useState('');
  const [barkUrl, setBarkUrl] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsWebhookUrl, setSmsWebhookUrl] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailToken, setEmailToken] = useState('');
  const [calendarFeedUrl, setCalendarFeedUrl] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
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
      const savedEmail = (await storage.get('nodd_email_address')) || '';
      const savedEmailToken = (await storage.get('nodd_email_token')) || '';
      const savedCalendarFeedToken = (await storage.get('nodd_calendar_feed_token')) || '';
      const th = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);
      setPushplusToken(token);
      setBarkUrl(bark);
      setSmsPhone(phone);
      setSmsWebhookUrl(smsUrl);
      setEmailAddress(savedEmail);
      setEmailToken(savedEmailToken);
      if (savedCalendarFeedToken && EMAIL_API_BASE_URL) {
        setCalendarFeedUrl(`${EMAIL_API_BASE_URL}/api/calendar/feed?token=${encodeURIComponent(savedCalendarFeedToken)}`);
      }
      setThreshold(th);
    })();
  }, []);

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
      if (emailToken) await publishCalendar(list);
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

  const publishCalendar = async (sourceAssignments = assignments) => {
    if (!emailToken || !EMAIL_API_BASE_URL) {
      showToast('请先绑定邮箱，再创建手机日历订阅');
      return;
    }

    try {
      const feedToken = (await storage.get('nodd_calendar_feed_token')) || '';
      const response = await http.post(`${EMAIL_API_BASE_URL}/api/calendar/publish`, {
        assignments: sourceAssignments,
        feedToken: feedToken || undefined
      }, { Authorization: `Bearer ${emailToken}` });
      const result = JSON.parse(response) as { feedToken?: string };
      if (!result.feedToken) throw new Error('Invalid calendar feed response');
      await storage.set('nodd_calendar_feed_token', result.feedToken);
      const url = `${EMAIL_API_BASE_URL}/api/calendar/feed?token=${encodeURIComponent(result.feedToken)}`;
      setCalendarFeedUrl(url);
      try {
        await navigator.clipboard?.writeText(url);
      } catch {
        // Clipboard permission is optional; the URL remains visible for copying.
      }
      showToast('订阅地址已更新并复制，可粘贴到手机日历');
    } catch {
      showToast('手机日历订阅更新失败');
    }
  };

  const requestEmailCode = async () => {
    setEmailBusy(true);
    try {
      const email = emailAddress.trim().toLowerCase();
      await callEmailApi(http, 'request-code', { email });
      await storage.set('nodd_email_address', email);
      setEmailAddress(email);
      showToast('验证码已发送');
    } catch {
      showToast('发送验证码失败');
    } finally {
      setEmailBusy(false);
    }
  };

  const verifyEmail = async () => {
    setEmailBusy(true);
    try {
      const result = await callEmailApi(http, 'verify-code', {
        email: emailAddress.trim().toLowerCase(),
        code: emailCode.trim()
      });
      const token = typeof result.token === 'string' ? result.token : '';
      const verifiedEmail = typeof result.email === 'string' ? result.email : '';
      if (!token || !verifiedEmail) throw new Error('Invalid email verification response');
      await storage.set('nodd_email_address', verifiedEmail);
      await storage.set('nodd_email_token', token);
      setEmailAddress(verifiedEmail);
      setEmailToken(token);
      setEmailCode('');
      showToast('邮箱绑定成功');
    } catch {
      showToast('邮箱验证失败');
    } finally {
      setEmailBusy(false);
    }
  };

  const testEmail = async () => {
    setEmailBusy(true);
    try {
      await callEmailApi(http, 'alert', { test: true }, emailToken);
      showToast('测试邮件已发送');
    } catch {
      showToast('测试邮件发送失败');
    } finally {
      setEmailBusy(false);
    }
  };

  const unbindEmail = async () => {
    setEmailBusy(true);
    try {
      await callEmailApi(http, 'unbind', {}, emailToken);
      await storage.remove('nodd_email_address');
      await storage.remove('nodd_email_token');
      setEmailAddress('');
      setEmailToken('');
      showToast('邮箱已解绑');
    } catch {
      showToast('邮箱解绑失败');
    } finally {
      setEmailBusy(false);
    }
  };

  const activeCount = assignments.filter((a) => a.remainingHours > 0).length;
  const overdueCount = assignments.filter((a) => a.remainingHours <= 0).length;
  const urgentCount = assignments.filter((a) => a.remainingHours > 0 && (a.urgency === 'critical' || a.urgency === 'urgent')).length;

  const filteredAssignments = assignments.filter((item) => {
    if (filter === 'active') return item.remainingHours > 0;
    if (filter === 'overdue') return item.remainingHours <= 0;
    return true;
  });

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    const direction = sortDirection === 'desc' ? -1 : 1;
    if (sortKey === 'deadline') {
      const aUnknown = a.deadlineTimestamp <= 0;
      const bUnknown = b.deadlineTimestamp <= 0;
      if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
      return (a.deadlineTimestamp - b.deadlineTimestamp) * direction;
    }

    const courseOrder = a.courseName.localeCompare(b.courseName, 'zh-CN');
    return (courseOrder || a.title.localeCompare(b.title, 'zh-CN')) * direction;
  });

  return (
    <div data-theme="nord" className="nodd-shell font-sans text-sm text-base-content">
      <button
        type="button"
        className="nodd-launcher fixed bottom-5 right-5 z-[999999]"
        aria-expanded={isOpen}
        aria-label="打开 NoDDL 桌宠面板"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img src={petImage} alt="NoDDL 桌宠" />
        {(urgentCount > 0 || activeCount > 0) && (
          <span className={`nodd-launcher-count ${urgentCount > 0 ? 'is-urgent' : ''}`}>
            {urgentCount || activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section className="nodd-panel fixed bottom-24 right-5 z-[999999] flex h-[min(640px,calc(100vh-7rem))] max-h-[680px] w-[min(460px,calc(100vw-2rem))] flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 text-base-content shadow-2xl">
          {toast && (
            <div className="absolute left-1/2 top-3 z-20 w-max max-w-[90%] -translate-x-1/2">
              <div className="alert alert-info px-4 py-2 text-sm shadow-lg">{toast}</div>
            </div>
          )}

          <header className="navbar min-h-0 gap-3 border-b border-base-300 bg-base-100 px-5 py-4">
            <div className="nodd-brand flex-1" aria-hidden="true">
              <img src={petImage} alt="" aria-hidden="true" />
            </div>
            <div className="flex-none flex items-center gap-1">
              <button
                type="button"
                className="btn btn-primary btn-sm whitespace-nowrap"
                title="全量扫描并同步所有课程作业"
                onClick={syncAllCourses}
              >
                <span aria-hidden="true">↻</span> 同步全部
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="关闭面板"
                title="关闭面板"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </header>

          <div role="tablist" className="tabs tabs-lift mx-4 mt-2 grid grid-cols-3">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'homework'}
              className={`tab ${activeTab === 'homework' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('homework')}
            >
              作业 ({assignments.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'settings'}
              className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              推送与提醒
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'eval'}
              className={`tab ${activeTab === 'eval' ? 'tab-active' : ''}`}
              onClick={() => {
                setActiveTab('eval');
                refreshSubmissions();
              }}
            >
              评测状态
            </button>
          </div>

          <div className="nodd-content min-h-0 flex-1 overflow-y-auto p-4">
            {activeTab === 'homework' && (
              <div className="space-y-3">
                <div className="nodd-filters join w-full">
                  <button
                    type="button"
                    className={`btn btn-sm join-item flex-1 ${filter === 'active' ? 'btn-active' : ''}`}
                    onClick={() => setFilter('active')}
                  >
                    进行中 <span className="badge badge-sm">{activeCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm join-item flex-1 ${filter === 'overdue' ? 'btn-active' : ''}`}
                    onClick={() => setFilter('overdue')}
                  >
                    已超期 <span className="badge badge-sm">{overdueCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm join-item flex-1 ${filter === 'all' ? 'btn-active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    全部 <span className="badge badge-sm">{assignments.length}</span>
                  </button>
                </div>
                <label className="flex items-center justify-between gap-3 text-xs text-base-content/60">
                  <span>排序</span>
                  <select
                    className="select select-sm flex-1"
                    value={sortKey}
                    onChange={(event) => setSortKey((event.currentTarget as HTMLSelectElement).value as typeof sortKey)}
                  >
                    <option value="deadline">截止时间</option>
                    <option value="course">课程</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-square"
                    aria-label={sortDirection === 'asc' ? '切换为逆序' : '切换为正序'}
                    title={sortDirection === 'asc' ? '切换为逆序' : '切换为正序'}
                    onClick={() => setSortDirection((value) => value === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </button>
                </label>

                {loading ? (
                  <div className="card border border-dashed border-base-300 bg-base-100">
                    <div className="card-body items-center gap-3 py-10 text-center">
                      <span className="loading loading-spinner loading-md text-primary" />
                      <p>正在同步作业数据...</p>
                    </div>
                  </div>
                ) : sortedAssignments.length === 0 ? (
                  <div className="card border border-dashed border-base-300 bg-base-100">
                    <div className="card-body items-center gap-2 py-10 text-center">
                      <span className="text-3xl">🎉</span>
                      <p className="text-base-content/70">当前分类下没有作业</p>
                    </div>
                  </div>
                ) : (
                  <div className="list w-full rounded-box border border-base-300 bg-base-100">
                    {sortedAssignments.map((hw) => {
                      const badgeClass =
                        hw.remainingHours <= 0 || hw.urgency === 'critical'
                          ? 'badge-error'
                          : hw.urgency === 'urgent'
                          ? 'badge-warning'
                          : hw.urgency === 'warning'
                          ? 'badge-info'
                          : 'badge-success';

                      return (
                        <article className="list-row" key={hw.id}>
                          <span className={`status ${badgeClass.replace('badge-', 'status-')}`} aria-hidden="true" />
                          <div className="list-col-grow min-w-0">
                            <div className="break-words font-semibold leading-snug">{hw.title}</div>
                            <div className="mt-1 text-xs text-base-content/60">{hw.courseName} · 截止 {hw.deadline}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`badge badge-sm badge-soft whitespace-nowrap ${badgeClass}`}>
                              {hw.remainingText}
                            </span>
                            {hw.url && (
                              <a
                                href={hw.url.startsWith('http') ? hw.url : `${window.location.origin}${hw.url.startsWith('/') ? '' : '/'}${hw.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-xs whitespace-nowrap"
                              >
                                前往作答
                              </a>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-3">
                {EMAIL_API_BASE_URL && (
                  <section className="card border border-base-300 bg-base-100">
                    <div className="card-body gap-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="card-title text-base">邮件提醒</h2>
                        {emailToken && <span className="badge badge-success">已绑定</span>}
                      </div>
                      {emailToken ? (
                        <>
                          <p className="break-all text-sm text-base-content/70">{emailAddress}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button className="btn btn-primary btn-sm" disabled={emailBusy} onClick={testEmail}>
                              测试邮件
                            </button>
                            <button className="btn btn-outline btn-error btn-sm" disabled={emailBusy} onClick={unbindEmail}>
                              解绑
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="grid gap-1.5 text-sm">
                            <span className="font-medium text-base-content/70">邮箱地址</span>
                            <input
                              type="email"
                              className="input w-full"
                              placeholder="name@example.com"
                              value={emailAddress}
                              disabled={emailBusy}
                              onInput={(e) => setEmailAddress((e.target as HTMLInputElement).value)}
                            />
                          </label>
                          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2">
                            <label className="grid min-w-0 gap-1.5 text-sm">
                              <span className="font-medium text-base-content/70">验证码</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="input w-full"
                                placeholder="6 位验证码"
                                value={emailCode}
                                disabled={emailBusy}
                                onInput={(e) => setEmailCode((e.target as HTMLInputElement).value)}
                              />
                            </label>
                            <button className="btn btn-outline btn-primary btn-sm" disabled={emailBusy} onClick={requestEmailCode}>
                              获取验证码
                            </button>
                            <button className="btn btn-primary btn-sm" disabled={emailBusy} onClick={verifyEmail}>
                              绑定
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                )}

                <section className="card border border-base-300 bg-base-100">
                  <div className="card-body gap-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="card-title text-base">手机日历</h2>
                      <span className={`badge ${emailToken ? 'badge-success' : 'badge-ghost'}`}>
                        {emailToken ? '可用' : '需绑定邮箱'}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/60">绑定邮箱后生成订阅地址，手机日历会定期自动刷新。</p>
                    <button className="btn btn-outline btn-sm" disabled={!emailToken || emailBusy} onClick={() => publishCalendar()}>
                      {emailToken ? '更新手机日历订阅' : '先绑定邮箱'}
                    </button>
                    {calendarFeedUrl && (
                      <input className="input input-sm" readOnly value={calendarFeedUrl} aria-label="手机日历订阅地址" />
                    )}
                  </div>
                </section>

                <section className="card border border-base-300 bg-base-100">
                  <div className="card-body p-4">
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-base-content/70">微信推送 · PushPlus</span>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="PushPlus Token"
                        value={pushplusToken}
                        onInput={(e) => setPushplusToken((e.target as HTMLInputElement).value)}
                      />
                    </label>
                  </div>
                </section>

                <details className="collapse collapse-arrow border border-base-300 bg-base-100">
                  <summary className="collapse-title min-h-0 px-4 py-3 font-medium">短信网关</summary>
                  <div className="collapse-content space-y-3">
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-base-content/70">接收手机号</span>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="手机号"
                        value={smsPhone}
                        onInput={(e) => setSmsPhone((e.target as HTMLInputElement).value)}
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-base-content/70">Webhook 地址</span>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="短信网关 Webhook 地址"
                        value={smsWebhookUrl}
                        onInput={(e) => setSmsWebhookUrl((e.target as HTMLInputElement).value)}
                      />
                    </label>
                  </div>
                </details>

                <section className="card border border-base-300 bg-base-100">
                  <div className="card-body p-4">
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-base-content/70">苹果设备推送 · Bark</span>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Bark 推送 URL"
                        value={barkUrl}
                        onInput={(e) => setBarkUrl((e.target as HTMLInputElement).value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="card border border-base-300 bg-base-100">
                  <div className="card-body p-4">
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-base-content/70">提前提醒</span>
                      <select
                        className="select w-full"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt((e.target as HTMLSelectElement).value, 10))}
                      >
                        <option value={24}>24 小时以内</option>
                        <option value={48}>48 小时以内</option>
                        <option value={72}>72 小时以内</option>
                        <option value={168}>1 周以内</option>
                      </select>
                    </label>
                  </div>
                </section>

                <button className="btn btn-outline btn-primary w-full" onClick={exportCalendar}>
                  📅 导出日历 (.ics)
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button className="btn btn-primary" onClick={savePushConfig}>
                    保存配置
                  </button>
                  <button className="btn btn-outline btn-primary" onClick={testPush}>
                    发送测试提醒
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'eval' && (
              <div className="space-y-3">
                {evalLoading ? (
                  <div className="card border border-dashed border-base-300 bg-base-100">
                    <div className="card-body items-center gap-3 py-10 text-center">
                      <span className="loading loading-spinner loading-md text-primary" />
                      <p>正在查询最新评测结果...</p>
                    </div>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="card bg-base-200">
                    <div className="card-body items-center py-10 text-center text-base-content/70">
                      暂无评测记录或页面未开放评测列表
                    </div>
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <article className="card border border-base-300 bg-base-100" key={sub.id}>
                      <div className="card-body gap-2 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">提交 #{sub.id}</span>
                          <span className={`badge ${sub.status === 'Accepted' ? 'badge-success' : sub.status === 'Judging' ? 'badge-warning' : 'badge-error'}`}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/60">提交时间：{sub.submitTime}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
