import { Assignment, HttpClient, PlatformConfig, ProblemDetail, PushConfig, SubmissionResult } from './types';
import { FetchHttpClient } from './adapter';
import { encryptPassword } from './crypto';
import {
  parseActiveAssignmentsHtml,
  parseAssignmentIndexHtml,
  parseCourseListHtml,
  parseProblemDetailHtml,
  parseSubmissionResultHtml,
  CourseInfo
} from './parser';
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
   * 登录一体化平台（自动加密密码）
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

    if (responseText.includes('loginErr=1') || responseText.includes('密码错误')) {
      return { success: false, message: '账号或密码错误' };
    }
    if (responseText.includes('loginErr=6')) {
      return { success: false, message: '需要输入验证码' };
    }

    return { success: true, message: '登录成功' };
  }

  /**
   * 获取当前学生加入的所有课程列表
   * 接口: GET /courselist.jsp 或 /main.jsp
   */
  async getCourses(): Promise<CourseInfo[]> {
    try {
      const html = await this.http.get(`${this.baseUrl}/courselist.jsp`, this.getAuthHeaders());
      let courses = parseCourseListHtml(html);
      if (courses.length === 0) {
        const mainHtml = await this.http.get(`${this.baseUrl}/main.jsp`, this.getAuthHeaders());
        courses = parseCourseListHtml(mainHtml);
      }
      return courses;
    } catch {
      return [];
    }
  }

  /**
   * 切换当前激活课程上下文
   * 接口: GET /courselist.jsp?courseID={id}
   */
  async enterCourse(courseId: string): Promise<void> {
    await this.http.get(`${this.baseUrl}/courselist.jsp?courseID=${encodeURIComponent(courseId)}`, this.getAuthHeaders());
  }

  /**
   * 查询所有课程中当前未完成的作业与实训
   * 接口: GET /assignment/mainActiveAssigns.jsp 及 /assignment/index.jsp
   */
  async getPendingAssignments(hoursThreshold = 72): Promise<Assignment[]> {
    const allAssignments: Assignment[] = [];
    const seenIds = new Set<string>();

    const courses = await this.getCourses();

    if (courses.length > 0) {
      // 遍历学生所修课程，进入课程上下文并获取活跃作业
      for (const course of courses) {
        try {
          await this.enterCourse(course.id);
          const activeHtml = await this.http.get(
            `${this.baseUrl}/assignment/mainActiveAssigns.jsp`,
            this.getAuthHeaders()
          );
          const list = parseActiveAssignmentsHtml(activeHtml, course.name);

          for (const item of list) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);

              // 若活跃列表中未带完整截止时间，查作业详情补齐
              if (item.deadline === '未标注明确截止时间' || item.deadline === '请查看详情') {
                try {
                  const detailHtml = await this.http.get(
                    `${this.baseUrl}/assignment/index.jsp?assignID=${item.id}`,
                    this.getAuthHeaders()
                  );
                  const detail = parseAssignmentIndexHtml(detailHtml);
                  if (detail.deadline) {
                    item.deadline = detail.deadline;
                    item.deadlineTimestamp = detail.deadlineTimestamp;
                    item.remainingHours = detail.remainingHours;
                    item.remainingText = detail.remainingText;
                  }
                } catch {}
              }

              allAssignments.push(item);
            }
          }
        } catch {
          // 单个课程异常不影响其他课程
        }
      }
    } else {
      // 单课程账户或当前已在课程会话中，直接读取活跃作业
      try {
        const activeHtml = await this.http.get(
          `${this.baseUrl}/assignment/mainActiveAssigns.jsp`,
          this.getAuthHeaders()
        );
        const list = parseActiveAssignmentsHtml(activeHtml, '当前课程');
        for (const item of list) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allAssignments.push(item);
          }
        }
      } catch {}
    }

    return allAssignments
      .filter(item => item.status === 'pending' && item.remainingHours <= hoursThreshold)
      .sort((a, b) => a.deadlineTimestamp - b.deadlineTimestamp);
  }

  /**
   * 获取题目详情与测试用例
   * 接口: GET /assignment/programList.jsp?proNum={proNum}&assignID={assignId}
   */
  async getProblemDetail(assignId: string, proNum = 1): Promise<ProblemDetail> {
    const url = `${this.baseUrl}/assignment/programList.jsp?proNum=${proNum}&assignID=${encodeURIComponent(assignId)}`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseProblemDetailHtml(`${assignId}_${proNum}`, html);
  }

  /**
   * 查询最新评测结果
   * 接口: GET /acm/problemset_stat.jsp
   */
  async getLatestSubmissions(): Promise<SubmissionResult[]> {
    const url = `${this.baseUrl}/acm/problemset_stat.jsp`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseSubmissionResultHtml(html);
  }

  /**
   * 触发死线告警推送
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
