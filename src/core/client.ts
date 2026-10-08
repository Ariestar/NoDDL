import { Assignment, Course, HttpClient, PlatformConfig, ProblemDetail, PushConfig, SubmissionResult, StorageAdapter } from './types';
import { FetchHttpClient } from './http';
import { encryptPassword } from './crypto';
import { HomeworkDB } from './db';
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
  public db?: HomeworkDB;

  constructor(config: PlatformConfig = {}, http: HttpClient = new FetchHttpClient(), storage?: StorageAdapter) {
    this.http = http;
    this.baseUrl = (config.baseUrl || 'http://115.156.107.145').replace(/\/+$/, '');
    this.sessionCookie = config.sessionCookie || '';
    if (storage) {
      this.db = new HomeworkDB(storage);
    }
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
   * 获取学生加入的课程列表（只读查询）
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
   * 只读读取当前活跃课程的作业列表（不篡改 Session 状态）
   */
  async getPendingAssignments(hoursThreshold = 72): Promise<Assignment[]> {
    const allAssignments: Assignment[] = [];
    const seenIds = new Set<string>();

    // 1. 只读读取当前课程作业主页
    try {
      const indexHtml = await this.http.get(
        `${this.baseUrl}/assignment/index.jsp`,
        this.getAuthHeaders()
      );
      const list = parseActiveAssignmentsHtml(indexHtml, '当前课程');
      for (const item of list) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allAssignments.push(item);
        }
      }
    } catch {}

    // 2. 补齐详情页精确截止时间
    for (const item of allAssignments) {
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
    }

    return allAssignments
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        if (a.remainingHours > 0 && b.remainingHours <= 0) return -1;
        if (a.remainingHours <= 0 && b.remainingHours > 0) return 1;
        if (a.remainingHours > 0 && b.remainingHours > 0) {
          return a.deadlineTimestamp - b.deadlineTimestamp;
        }
        return b.deadlineTimestamp - a.deadlineTimestamp;
      });
  }

  /**
   * 全量安全同步所有课程的作业并持久化存入数据库
   * 【核心保障】爬取前记录当前用户所处课程 ID，依序抓取各门课后立即切回原课程，彻底杜绝串课
   */
  async safeSyncAllCourses(currentCourseId?: string, onProgress?: (msg: string) => void): Promise<Assignment[]> {
    const courses = await this.getCourses();
    if (courses.length === 0) {
      const assigns = await this.getPendingAssignments();
      if (this.db) {
        await this.db.upsertCourse('default', '当前课程', assigns);
      }
      return assigns;
    }

    for (let i = 0; i < courses.length; i++) {
      const c = courses[i];
      if (onProgress) onProgress(`正在同步 [${i + 1}/${courses.length}] 《${c.name}》...`);
      try {
        await this.enterCourse(c.id);
        const indexHtml = await this.http.get(`${this.baseUrl}/assignment/index.jsp`, this.getAuthHeaders());
        const list = parseActiveAssignmentsHtml(indexHtml, c.name);

        // 针对缺日期的作业定向只读请求详情补齐真实 DDL
        for (const item of list) {
          if (item.deadline === '请查看详情' || item.deadlineTimestamp === 0) {
            try {
              const detailHtml = await this.http.get(`${this.baseUrl}/assignment/index.jsp?assignID=${item.id}`, this.getAuthHeaders());
              const detail = parseAssignmentDetailHtml(detailHtml);
              if (detail.deadline) {
                item.deadline = detail.deadline;
                item.deadlineTimestamp = detail.deadlineTimestamp;
                item.remainingHours = detail.remainingHours;
                item.remainingText = detail.remainingText;
              }
            } catch {}
          }
        }

        if (this.db) {
          await this.db.upsertCourse(c.id, c.name, list);
        }
      } catch {}
    }

    // 关键安全重置：必须立刻切回用户当前所在的课程上下文！
    if (currentCourseId) {
      if (onProgress) onProgress('正在恢复当前页面课程状态...');
      try {
        await this.enterCourse(currentCourseId);
      } catch {}
    }

    return this.db ? this.db.getAllAssignments() : this.getPendingAssignments();
  }

  /**
   * 获取题目详情与测试用例（兼容 programList.jsp 与 fileUploadList.jsp）
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
    const allPending = this.db ? await this.db.getAllAssignments() : await this.getPendingAssignments(threshold);

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
