import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Assignment, HttpClient, SubmissionResult } from '../../core/types';
import { CourseGradingClient } from '../../core/client';
import { BrowserStorage } from '../browser-adapter';
import { createDeadlineCalendar } from '../../core/calendar';
import { parseActiveCourseInfo } from '../../core/parsers';
import {
  callEmailApi,
  getServiceConfig,
  isServiceUrl,
  API_BASE_URL_STORAGE_KEY,
  type ServiceConfig
} from '../email-api';
import { AUTO_SYNC_TOKEN_KEY, bindAutomaticSync, getAutomaticSyncStatus, setAutomaticSyncEnabled } from '../sync-api';
import { readCourseSessionCookie } from '../session-bridge';
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
  const [calendarFeedToken, setCalendarFeedToken] = useState('');
  const [service, setService] = useState<ServiceConfig | null>(null);
  const [serviceUrl, setServiceUrl] = useState('');
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [autoSyncBusy, setAutoSyncBusy] = useState(false);
  const [autoSyncToken, setAutoSyncToken] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [emailBusy, setEmailBusy] = useState(false);
  const [threshold, setThreshold] = useState(72);
  const syncInProgress = useRef(false);
  const apiBaseUrl = service?.baseUrl || '';

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
      const configured = await getServiceConfig(storage);
      const savedEmail = (await configured.storage.get('nodd_email_address')) || '';
      const savedEmailToken = (await configured.storage.get('nodd_email_token')) || '';
      const savedCalendarFeedToken = (await configured.storage.get('nodd_calendar_feed_token')) || '';
      const savedAutoSyncToken = (await configured.storage.get(AUTO_SYNC_TOKEN_KEY)) || '';
      const th = parseInt((await storage.get('nodd_hours_threshold')) || '72', 10);
      setPushplusToken(token);
      setBarkUrl(bark);
      setSmsPhone(phone);
      setSmsWebhookUrl(smsUrl);
      setEmailAddress(savedEmail);
      setEmailToken(savedEmailToken);
      setService(configured);
      setServiceUrl(configured.baseUrl);
      setCalendarFeedToken(savedCalendarFeedToken);
      setAutoSyncToken(savedAutoSyncToken);
      setThreshold(th);
      if (savedAutoSyncToken && configured.baseUrl) {
        try {
          const status = await getAutomaticSyncStatus(http, configured.baseUrl, savedAutoSyncToken);
          setAutoSyncEnabled(status.enabled);
        } catch (error) {
          console.error('[NoDDL] 自动同步状态读取失败', error);
        }
      } else if (!savedAutoSyncToken) {
        await enableAutomaticSync(configured, '', savedCalendarFeedToken);
      }
      await syncAllCourses(configured);
    })().catch((error) => {
      showToast(`同步失败：${error instanceof Error ? error.message : String(error)}`);
    });
  }, []);

  const saveServiceUrl = async () => {
    if (!isServiceUrl(serviceUrl)) {
      showToast('请输入有效的 HTTPS 服务地址');
      return;
    }
    await storage.set(API_BASE_URL_STORAGE_KEY, serviceUrl.trim().replace(/\/+$/, ''));
    window.location.reload();
  };

  // 一键全量同步所有课程（带安全 Session 恢复）
  const syncAllCourses = async (configured = service) => {
    if (!configured || syncInProgress.current) return;
    syncInProgress.current = true;
    setLoading(true);
    showToast('正在全量安全同步所有课程...');
    try {
      const curId = new URLSearchParams(window.location.search).get('courseID') ||
        parseActiveCourseInfo(document.documentElement.innerHTML).id || undefined;

      const list = await client.safeSyncAllCourses(curId, (msg) => showToast(msg));
      setAssignments(list);
      let publishedCount = 0;
      if (configured.baseUrl) {
        try {
          publishedCount = await publishCalendar(list, configured);
        } catch (error) {
          showToast(`课程已同步，日历更新失败：${error instanceof Error ? error.message : String(error)}`);
          return;
        }
      }
      showToast(`同步完成 · 日历 ${publishedCount} 项`);
    } catch (error) {
      showToast(`同步失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      syncInProgress.current = false;
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

  const exportCalendar = () => {
    const calendar = createDeadlineCalendar(assignments, window.location.origin);
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

  const publishCalendar = async (sourceAssignments: Assignment[], configured: ServiceConfig): Promise<number> => {
    if (!configured.baseUrl) throw new Error('Calendar service is not configured');
    setCalendarBusy(true);
    try {
      const feedToken = (await configured.storage.get('nodd_calendar_feed_token')) || '';
      const response = await http.post(`${configured.baseUrl}/api/calendar/publish`, {
        assignments: sourceAssignments,
        feedToken: feedToken || undefined
      });
      const result = JSON.parse(response) as { feedToken?: string; assignments?: number };
      if (!result.feedToken || result.assignments !== sourceAssignments.length) {
        throw new Error('日历服务未确认完整写入');
      }
      await configured.storage.set('nodd_calendar_feed_token', result.feedToken);
      setCalendarFeedToken(result.feedToken);
      return result.assignments;
    } finally {
      setCalendarBusy(false);
    }
  };

  const enableAutomaticSync = async (configured = service, currentToken = autoSyncToken, currentFeedToken = calendarFeedToken) => {
    if (!configured?.baseUrl) return;
    setAutoSyncBusy(true);
    try {
      const cookie = await readCourseSessionCookie();
      const result = await bindAutomaticSync(http, configured.baseUrl, cookie, currentToken, currentFeedToken);
      await configured.storage.set(AUTO_SYNC_TOKEN_KEY, result.token);
      await configured.storage.set('nodd_calendar_feed_token', result.feedToken);
      setAutoSyncToken(result.token);
      setAutoSyncEnabled(true);
      setCalendarFeedToken(result.feedToken);
      await publishCalendar(assignments, configured);
    } catch (error) {
      console.error('[NoDDL] 自动同步绑定失败', error);
      showToast('自动同步绑定失败');
    } finally {
      setAutoSyncBusy(false);
    }
  };

  const toggleAutomaticSync = async (enabled: boolean) => {
    if (!service?.baseUrl || !autoSyncToken) {
      if (enabled) await enableAutomaticSync();
      return;
    }
    setAutoSyncBusy(true);
    try {
      await setAutomaticSyncEnabled(http, service.baseUrl, autoSyncToken, enabled);
      setAutoSyncEnabled(enabled);
      showToast(enabled ? '自动同步已开启' : '自动同步已关闭');
    } catch {
      showToast('自动同步开关更新失败');
    } finally {
      setAutoSyncBusy(false);
    }
  };

  const requestEmailCode = async () => {
    if (!service?.baseUrl) return;
    setEmailBusy(true);
    try {
      const email = emailAddress.trim().toLowerCase();
      await callEmailApi(http, service.baseUrl, 'request-code', { email });
      await service.storage.set('nodd_email_address', email);
      setEmailAddress(email);
      showToast('验证码已发送');
    } catch {
      showToast('发送验证码失败');
    } finally {
      setEmailBusy(false);
    }
  };

  const verifyEmail = async () => {
    if (!service?.baseUrl) return;
    setEmailBusy(true);
    try {
      const result = await callEmailApi(http, service.baseUrl, 'verify-code', {
        email: emailAddress.trim().toLowerCase(),
        code: emailCode.trim()
      });
      const token = typeof result.token === 'string' ? result.token : '';
      const verifiedEmail = typeof result.email === 'string' ? result.email : '';
      if (!token || !verifiedEmail) throw new Error('Invalid email verification response');
      await service.storage.set('nodd_email_address', verifiedEmail);
      await service.storage.set('nodd_email_token', token);
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
    if (!service?.baseUrl) return;
    setEmailBusy(true);
    try {
      await callEmailApi(http, service.baseUrl, 'alert', { test: true }, emailToken);
      showToast('测试邮件已发送');
    } catch {
      showToast('测试邮件发送失败');
    } finally {
      setEmailBusy(false);
    }
  };

  const unbindEmail = async () => {
    if (!service?.baseUrl) return;
    setEmailBusy(true);
    try {
      await callEmailApi(http, service.baseUrl, 'unbind', {}, emailToken);
      await service.storage.remove('nodd_email_address');
      await service.storage.remove('nodd_email_token');
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
                title="同步全部课程、作业和日历"
                disabled={!service || loading || calendarBusy || emailBusy}
                onClick={() => syncAllCourses()}
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
                        hw.status !== 'pending'
                          ? 'badge-success'
                          : hw.remainingHours <= 0 || hw.urgency === 'critical'
                          ? 'badge-error'
                          : hw.urgency === 'urgent'
                          ? 'badge-warning'
                          : hw.urgency === 'warning'
                          ? 'badge-info'
                          : 'badge-success';
                      const statusText = hw.status === 'graded' ? '已批改' : hw.status === 'submitted' ? '已提交' : hw.remainingText;

                      return (
                        <article className="list-row" key={hw.id}>
                          <span className={`status ${badgeClass.replace('badge-', 'status-')}`} aria-hidden="true" />
                          <div className="list-col-grow min-w-0">
                            <div className="break-words font-semibold leading-snug">{hw.title}</div>
                            <div className="mt-1 text-xs text-base-content/60">{hw.courseName} · 截止 {hw.deadline}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`badge badge-sm badge-soft whitespace-nowrap ${badgeClass}`}>
                              {statusText}
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
                <section className="card border border-primary/20 bg-base-100 shadow-sm">
                  <div className="card-body gap-3 p-4">
                    <h2 className="card-title text-base">服务地址</h2>
                    <p className="text-xs text-base-content/60">使用默认服务，或填入你自己部署的 Cloudflare Worker 地址。</p>
                    <div className="flex gap-2">
                      <input className="input input-sm min-w-0 flex-1" value={serviceUrl} placeholder="https://你的 Worker.workers.dev" onInput={(event) => setServiceUrl((event.currentTarget as HTMLInputElement).value)} />
                      <button className="btn btn-primary btn-sm" onClick={() => void saveServiceUrl()}>保存</button>
                    </div>
                  </div>
                </section>

                <section className="card border border-primary/20 bg-base-100 shadow-sm">
                  <div className="card-body gap-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="card-title text-base">自动同步</h2>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <span>{autoSyncToken ? '已开启' : apiBaseUrl ? '绑定中' : '未配置'}</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={autoSyncEnabled}
                          disabled={!apiBaseUrl || autoSyncBusy}
                          aria-label="自动同步"
                          onChange={(event) => {
                            void toggleAutomaticSync((event.currentTarget as HTMLInputElement).checked);
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-base-content/60">
                      扩展打开后自动绑定课程会话；服务端每天抓取全部课程、作业和云实验，日历订阅也会随之更新。
                    </p>
                    <span className="text-xs text-base-content/60">
                    </span>
                  </div>
                </section>

                <details className="nodd-settings-details collapse collapse-arrow rounded-box border border-base-300 bg-base-100" open>
                  <summary className="collapse-title flex min-h-0 cursor-pointer items-center justify-between gap-2 px-4 py-3 font-medium">
                    <span>手机日历</span>
                  </summary>
                  <div className="collapse-content space-y-3 border-t border-base-300">
                    <p className="text-xs text-base-content/60">在手机日历中添加 CalDAV 账户，填写下面三项即可。日历会随自动同步更新。</p>
                    {calendarFeedToken ? (
                      <>
                        <label className="grid gap-1.5 text-sm">
                          <span className="font-medium text-base-content/70">CalDAV 服务器地址</span>
                          <input className="input input-sm" readOnly value={`${apiBaseUrl}/api/caldav-server/`} />
                        </label>
                        <label className="grid gap-1.5 text-sm">
                          <span className="font-medium text-base-content/70">账户名称</span>
                          <input className="input input-sm" readOnly value="noddl" />
                        </label>
                        <label className="grid gap-1.5 text-sm">
                          <span className="font-medium text-base-content/70">账户密码</span>
                          <input className="input input-sm" readOnly value={calendarFeedToken} />
                        </label>
                      </>
                    ) : (
                      <div className="alert alert-info py-3 text-sm">自动同步绑定后会生成手机日历账户信息。</div>
                    )}
                    <div className="flex items-center justify-between gap-3 rounded-box border border-base-300 bg-base-200 px-3 py-2">
                      <span className="text-sm font-medium">导出日历文件 <span className="text-xs text-base-content/60">(.ics)</span></span>
                      <button className="btn btn-outline btn-primary btn-sm" onClick={exportCalendar}>导出</button>
                    </div>
                  </div>
                </details>

                {apiBaseUrl && (
                  <details className="nodd-settings-details collapse collapse-arrow rounded-box border border-base-300 bg-base-100" open>
                    <summary className="collapse-title flex min-h-0 cursor-pointer items-center justify-between gap-2 px-4 py-3 font-medium">
                      <span>邮件提醒</span>
                    </summary>
                    <div className="collapse-content space-y-3 border-t border-base-300">
                      {emailToken ? (
                        <>
                          <p className="break-all text-sm text-base-content/70">{emailAddress}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button className="btn btn-primary btn-sm" disabled={emailBusy} onClick={testEmail}>测试邮件</button>
                            <button className="btn btn-outline btn-error btn-sm" disabled={emailBusy} onClick={unbindEmail}>解绑</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="grid gap-1.5 text-sm">
                            <span className="font-medium text-base-content/70">邮箱地址</span>
                            <input type="email" className="input w-full" placeholder="name@example.com" value={emailAddress} disabled={emailBusy} onInput={(e) => setEmailAddress((e.target as HTMLInputElement).value)} />
                          </label>
                          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2">
                            <label className="grid min-w-0 gap-1.5 text-sm">
                              <span className="font-medium text-base-content/70">验证码</span>
                              <input type="text" inputMode="numeric" className="input w-full" placeholder="6 位验证码" value={emailCode} disabled={emailBusy} onInput={(e) => setEmailCode((e.target as HTMLInputElement).value)} />
                            </label>
                            <button className="btn btn-outline btn-primary btn-sm" disabled={emailBusy} onClick={requestEmailCode}>获取验证码</button>
                            <button className="btn btn-primary btn-sm" disabled={emailBusy} onClick={verifyEmail}>绑定</button>
                          </div>
                        </>
                      )}
                    </div>
                  </details>
                )}

                <details className="nodd-settings-details collapse collapse-arrow rounded-box border border-base-300 bg-base-100" open>
                  <summary className="collapse-title flex min-h-0 cursor-pointer items-center justify-between gap-2 px-4 py-3 font-medium">
                    <span>微信推送 · PushPlus</span>
                  </summary>
                  <div className="collapse-content border-t border-base-300">
                    <input type="text" className="input w-full" placeholder="PushPlus Token" value={pushplusToken} onInput={(e) => setPushplusToken((e.target as HTMLInputElement).value)} />
                  </div>
                </details>

                <details className="nodd-settings-details collapse collapse-arrow rounded-box border border-base-300 bg-base-100" open>
                  <summary className="collapse-title flex min-h-0 cursor-pointer items-center justify-between gap-2 px-4 py-3 font-medium">
                    <span>短信网关</span>
                  </summary>
                  <div className="collapse-content space-y-3 border-t border-base-300">
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-base-content/70">接收手机号</span>
                      <input type="text" className="input w-full" placeholder="手机号" value={smsPhone} onInput={(e) => setSmsPhone((e.target as HTMLInputElement).value)} />
                    </label>
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-base-content/70">Webhook 地址</span>
                      <input type="text" className="input w-full" placeholder="短信网关 Webhook 地址" value={smsWebhookUrl} onInput={(e) => setSmsWebhookUrl((e.target as HTMLInputElement).value)} />
                    </label>
                  </div>
                </details>

                <details className="nodd-settings-details collapse collapse-arrow rounded-box border border-base-300 bg-base-100" open>
                  <summary className="collapse-title flex min-h-0 cursor-pointer items-center justify-between gap-2 px-4 py-3 font-medium">
                    <span>苹果设备推送 · Bark</span>
                  </summary>
                  <div className="collapse-content border-t border-base-300">
                    <input type="text" className="input w-full" placeholder="Bark 推送 URL" value={barkUrl} onInput={(e) => setBarkUrl((e.target as HTMLInputElement).value)} />
                  </div>
                </details>

                <details className="nodd-settings-details collapse collapse-arrow rounded-box border border-base-300 bg-base-100" open>
                  <summary className="collapse-title flex min-h-0 cursor-pointer items-center justify-between gap-2 px-4 py-3 font-medium">
                    <span>提醒时间</span>
                  </summary>
                  <div className="collapse-content border-t border-base-300">
                    <select className="select w-full" value={threshold} onChange={(e) => setThreshold(parseInt((e.target as HTMLSelectElement).value, 10))}>
                      <option value={24}>24 小时以内</option>
                      <option value={48}>48 小时以内</option>
                      <option value={72}>72 小时以内</option>
                      <option value={168}>1 周以内</option>
                    </select>
                  </div>
                </details>

                <button className="btn btn-primary w-full" onClick={savePushConfig}>保存配置</button>
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
