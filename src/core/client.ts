import { Assignment, Course, HttpClient, PlatformConfig, ProblemDetail, PushConfig, SubmissionResult } from './types';
import { FetchHttpClient } from './http';
import { encryptPassword } from './crypto';
import {
  parseActiveAssignmentsHtml,
  parseAssignmentDetailHtml,
  parseCourseListHtml,
  parseProblemDetailHtml,
  parseSubmissionsHtml
} from './parsers';

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
   * 登录平台（自动使用固定 AES 密钥加密）
   */
  async login(stid: string, plainPwd: string): Promise<{ success: boolean; message: string }> {
    const encryptedPwd = encryptPassword(plainPwd);
    const body = new URLSearchParams({
      IndexStyle: '1',
      stid,
      pwd: encryptedPwd
    }).toString();

    const responseText = await this.http.post(`${this.baseUrl}/login/loginproc.jsp`, body);

    if (responseText.includes('loginErr=1') || responseText.includes('密码错误')) {
      return { success: false, message: '账号或密码错误' };
    }
    if (responseText.includes('loginErr=6')) {
      return { success: false, message: '需要输入图形验证码' };
    }

    return { success: true, message: '登录成功' };
  }

  /**
   * 获取学生加入的课程列表
   */
  async getCourses(): Promise<Course[]> {
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
   */
  async enterCourse(courseId: string): Promise<void> {
    await this.http.get(`${this.baseUrl}/courselist.jsp?courseID=${encodeURIComponent(courseId)}`, this.getAuthHeaders());
  }

  /**
   * 汇聚所有课程中未完成的作业与实训
   * 默认排序：未截止的按 DDL 紧迫度升序排在最前，已逾期的排在后面
   */
  async getPendingAssignments(hoursThreshold = 72): Promise<Assignment[]> {
    const allAssignments: Assignment[] = [];
    const seenIds = new Set<string>();

    const courses = await this.getCourses();

    if (courses.length > 0) {
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

              if (item.deadline === '请查看详情' || item.deadlineTimestamp === 0) {
                try {
                  const detailHtml = await this.http.get(
                    `${this.baseUrl}/assignment/index.jsp?assignID=${item.id}`,
                    this.getAuthHeaders()
                  );
                  const detail = parseAssignmentDetailHtml(detailHtml);
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
        } catch {}
      }
    } else {
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
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        // 进行中的排在最前（早截止的更靠前）
        if (a.remainingHours > 0 && b.remainingHours <= 0) return -1;
        if (a.remainingHours <= 0 && b.remainingHours > 0) return 1;
        if (a.remainingHours > 0 && b.remainingHours > 0) {
          return a.deadlineTimestamp - b.deadlineTimestamp;
        }
        // 都已逾期的排在后面（按最近逾期排）
        return b.deadlineTimestamp - a.deadlineTimestamp;
      });
  }

  /**
   * 获取题目详情与测试用例
   */
  async getProblemDetail(assignId: string, proNum = 1): Promise<ProblemDetail> {
    const url = `${this.baseUrl}/assignment/programList.jsp?proNum=${proNum}&assignID=${encodeURIComponent(assignId)}`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseProblemDetailHtml(`${assignId}_${proNum}`, html);
  }

  /**
   * 查询最新评测结果
   */
  async getLatestSubmissions(): Promise<SubmissionResult[]> {
    const url = `${this.baseUrl}/acm/problemset_stat.jsp`;
    const html = await this.http.get(url, this.getAuthHeaders());
    return parseSubmissionsHtml(html);
  }

  /**
   * 触发 DDL 告警推送
   */
  async triggerPushAlert(config: PushConfig): Promise<{ sent: boolean; count: number; error?: string }> {
    const threshold = config.hoursThreshold ?? 48;
    const allPending = await this.getPendingAssignments(threshold);

    // 仅针对在阈值时间内的未截止作业或最新逾期作业发送
    const activeUrgent = allPending.filter(a => a.remainingHours > 0 && a.remainingHours <= threshold);
    if (activeUrgent.length === 0) {
      return { sent: false, count: 0 };
    }

    const title = `【NoDDL 提醒】有 ${activeUrgent.length} 项作业即将到达 DDL`;
    const markdown = [
      `### 🔔 NoDDL 作业 DDL 提醒`,
      `当前有 **${activeUrgent.length}** 项作业即将截止：`,
      '',
      ...activeUrgent.map((item, idx) => `${idx + 1}. [${item.courseName}] ${item.title} (截止: ${item.deadline}, ${item.remainingText})`)
    ].join('\n');

    try {
      if (config.pushplusToken) {
        await this.http.post('https://www.pushplus.plus/send', {
          token: config.pushplusToken,
          title,
          content: markdown.replace(/\n/g, '<br>'),
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

      return { sent: true, count: activeUrgent.length };
    } catch (err) {
      return { sent: false, count: activeUrgent.length, error: String(err) };
    }
  }
}
