import { Assignment, HttpClient, PlatformConfig, ProblemDetail, PushConfig, SubmissionResult } from './types';
import { FetchHttpClient } from './adapter';
import { encryptPassword } from './crypto';
import { parseHomeworkListHtml, parseProblemDetailHtml, parseSubmissionResultHtml } from './parser';
import { formatNotificationContent } from './ddl';

export class CourseGradingClient {
  private baseUrl: string;
  private http: HttpClient;
  private sessionCookie: string;

  constructor(config: PlatformConfig = {}, http: HttpClient = new FetchHttpClient()) {
    this.http = http;
    this.baseUrl = (config.baseUrl || 'http://115.156.107.145').replace(/\/+$/, '');
    this.sessionCookie = config.sessionCookie || '';
  }

  setSessionCookie(cookie: string) {
    this.sessionCookie = cookie;
  }

  getSessionCookie(): string {
    return this.sessionCookie;
  }

  private getAuthHeaders(): Record<string, string> {
    return this.sessionCookie ? { Cookie: this.sessionCookie } : {};
  }

  /**
   * 登录平台（自动使用固定密钥加密密码）
   */
  async login(stid: string, plainPwd: string): Promise<{ success: boolean; message: string }> {
    const encryptedPwd = encryptPassword(plainPwd);
    const body = new URLSearchParams({
      IndexStyle: '1',
      stid,
      pwd: encryptedPwd
    }).toString();

    const responseText = await this.http.post(`${this.baseUrl}/login/loginproc.jsp`, body, {
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    if (responseText.includes('密码错误') || responseText.includes('用户不存在')) {
      return { success: false, message: '账号或密码错误' };
    }

    return { success: true, message: '登录成功' };
  }

  /**
   * 获取所有未提交且按截止时间升序排序的作业列表
   */
  async getPendingAssignments(hoursThreshold = 72): Promise<Assignment[]> {
    const endpoints = [
      `${this.baseUrl}/pages`,
      `${this.baseUrl}/sv2/indexexp/index.jsp`,
      `${this.baseUrl}/student/homework`
    ];

    const allAssignments: Assignment[] = [];
    const seenIds = new Set<string>();

    for (const url of endpoints) {
      try {
        const html = await this.http.get(url, this.getAuthHeaders());
        for (const item of parseHomeworkListHtml(html)) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allAssignments.push(item);
          }
        }
      } catch {
        // 忽略子端点异常
      }
    }

    return allAssignments
      .filter(item => item.status === 'pending' && item.remainingHours <= hoursThreshold)
      .sort((a, b) => a.deadlineTimestamp - b.deadlineTimestamp);
  }

  /**
   * 获取题目详情与测试用例
   */
  async getProblemDetail(problemId: string): Promise<ProblemDetail> {
    const url = `${this.baseUrl}/pages/problem/detail.jsp?id=${encodeURIComponent(problemId)}`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseProblemDetailHtml(problemId, html);
  }

  /**
   * 查询最新评测结果
   */
  async getLatestSubmissions(): Promise<SubmissionResult[]> {
    const url = `${this.baseUrl}/acm/index.jsp`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseSubmissionResultHtml(html);
  }

  /**
   * 触发死线告警推送（支持 PushPlus / Bark / Webhook）
   */
  async triggerPushAlert(config: PushConfig): Promise<{ sent: boolean; count: number; error?: string }> {
    const threshold = config.hoursThreshold ?? 48;
    const pending = await this.getPendingAssignments(threshold);

    if (pending.length === 0) {
      return { sent: false, count: 0 };
    }

    const { title, markdown, html } = formatNotificationContent(pending);

    try {
      if (config.pushplusToken) {
        await this.http.post('https://www.pushplus.plus/send', {
          token: config.pushplusToken,
          title,
          content: html,
          template: 'html'
        });
      }

      if (config.barkUrl) {
        const barkBase = config.barkUrl.replace(/\/+$/, '');
        await this.http.get(`${barkBase}/${encodeURIComponent(title)}/${encodeURIComponent(markdown)}?group=NoDDL`);
      }

      if (config.customWebhookUrl) {
        await this.http.post(config.customWebhookUrl, {
          msg_type: 'text',
          content: { text: `${title}\n\n${markdown}` }
        });
      }

      return { sent: true, count: pending.length };
    } catch (err) {
      return { sent: false, count: pending.length, error: String(err) };
    }
  }
}
