import { Assignment, Course, HttpClient, PlatformConfig, ProblemDetail, PushConfig, SubmissionResult, StorageAdapter } from './types';
import { FetchHttpClient } from './http';
import { encryptPassword } from './crypto';
import { HomeworkDB } from './db';
import {
  parseActiveAssignmentsHtml,
  parseAssignmentDetailHtml,
  parseActiveCourseInfo,
  parseCourseListHtml,
  parseProblemDetailHtml,
  parseSubmissionsHtml
} from './parsers';
import { calculateUrgency } from './time';

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

  private async fillAssignmentDeadline(item: Assignment, detailUrl: string): Promise<void> {
    if (item.deadline !== '请查看详情' && item.deadlineTimestamp !== 0) return;
    try {
      const detail = parseAssignmentDetailHtml(
        await this.http.get(detailUrl, this.getAuthHeaders())
      );
      if (detail.deadlineTimestamp > 0) {
        item.deadline = detail.deadline!;
        item.deadlineTimestamp = detail.deadlineTimestamp;
        item.remainingHours = detail.remainingHours;
        item.remainingText = detail.remainingText;
        item.urgency = calculateUrgency(detail.remainingHours);
      }
    } catch {}
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
  async getPendingAssignments(): Promise<Assignment[]> {
    const allAssignments: Assignment[] = [];
    const seenIds = new Set<string>();

    try {
      const indexHtml = await this.http.get(
        `${this.baseUrl}/assignment/index.jsp`,
        this.getAuthHeaders()
      );
      const activeCourse = parseActiveCourseInfo(indexHtml);
      const courseId = activeCourse.id || '';
      const courseName = activeCourse.name || '';

      if (this.db && courseId && courseName) {
        await this.db.upsertCourse(courseId, courseName);
      }

      const list = parseActiveAssignmentsHtml(indexHtml, courseName, courseId);
      for (const item of list) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allAssignments.push(item);
        }
      }
    } catch {}

    // 补齐详情页精确截止时间（真实卡片作业时间）
    for (const item of allAssignments) {
      const detailUrl = item.courseId
        ? `${this.baseUrl}/assignment/index.jsp?courseID=${item.courseId}&assignID=${item.id}`
        : `${this.baseUrl}/assignment/index.jsp?assignID=${item.id}`;
      await this.fillAssignmentDeadline(item, detailUrl);

      if (this.db) {
        await this.db.upsertAssignment(item);
      }
    }

    if (this.db) {
      return this.db.getAllAssignments();
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
      return this.getPendingAssignments();
    }

    for (let i = 0; i < courses.length; i++) {
      const c = courses[i];
      if (onProgress) onProgress(`正在同步 [${i + 1}/${courses.length}] 《${c.name}》...`);
      try {
        if (this.db) {
          await this.db.upsertCourse(c.id, c.name);
        }
        await this.enterCourse(c.id);
        const indexHtml = await this.http.get(`${this.baseUrl}/assignment/index.jsp`, this.getAuthHeaders());
        const list = parseActiveAssignmentsHtml(indexHtml, c.name, c.id);

        for (const item of list) {
          item.courseId = c.id;
          item.courseName = c.name;
          item.url = `/assignment/index.jsp?courseID=${c.id}&assignID=${item.id}`;

          await this.fillAssignmentDeadline(
            item,
            `${this.baseUrl}/assignment/index.jsp?courseID=${c.id}&assignID=${item.id}`
          );

          if (this.db) {
            await this.db.upsertAssignment(item);
          }
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
   * 触发 DDL 告警推送（支持微信 PushPlus、Bark iOS 以及短信提醒 SMS）
   */
  async triggerPushAlert(config: PushConfig): Promise<{ sent: boolean; count: number; error?: string }> {
    const threshold = config.hoursThreshold ?? 48;
    const allPending = this.db ? await this.db.getAllAssignments() : await this.getPendingAssignments();

    const activeUrgent = allPending.filter(a => a.remainingHours > 0 && a.remainingHours <= threshold);
    if (activeUrgent.length === 0) {
      return { sent: false, count: 0, error: '当前暂无即将截止的作业' };
    }

    const title = `【NoDDL 提醒】有 ${activeUrgent.length} 项作业即将到达 DDL`;
    const markdown = [
      `### 🔔 NoDDL 作业 DDL 提醒`,
      `当前有 **${activeUrgent.length}** 项作业即将截止：`,
      '',
      ...activeUrgent.map((item, idx) => `${idx + 1}. [${item.courseName}] ${item.title} (截止: ${item.deadline}, ${item.remainingText})`)
    ].join('\n');

    const smsText = `【NoDDL】您有${activeUrgent.length}项作业即将截止：` +
      activeUrgent.slice(0, 3).map(i => `${i.courseName}-${i.title}(${i.remainingText})`).join('；') +
      (activeUrgent.length > 3 ? `等共${activeUrgent.length}项` : '') +
      '，请及时提交！';

    let triggeredAny = false;

    try {
      if (config.pushplusToken) {
        await this.http.post('https://www.pushplus.plus/send', {
          token: config.pushplusToken,
          title,
          content: markdown.replace(/\n/g, '<br>'),
          template: 'html'
        });
        triggeredAny = true;
      }

      if (config.barkUrl) {
        const barkBase = config.barkUrl.replace(/\/+$/, '');
        await this.http.get(`${barkBase}/${encodeURIComponent(title)}/${encodeURIComponent(markdown)}?group=NoDDL`);
        triggeredAny = true;
      }

      if (config.smsWebhookUrl) {
        let targetUrl = config.smsWebhookUrl;
        const phone = config.smsPhone || '';
        if (targetUrl.includes('{phone}') || targetUrl.includes('{msg}')) {
          targetUrl = targetUrl
            .replace(/\{phone\}/g, encodeURIComponent(phone))
            .replace(/\{msg\}/g, encodeURIComponent(smsText));
          await this.http.get(targetUrl);
        } else {
          await this.http.post(targetUrl, {
            phone,
            to: phone,
            msg: smsText,
            message: smsText,
            text: smsText
          });
        }
        triggeredAny = true;
      }

      if (config.customWebhookUrl) {
        await this.http.post(config.customWebhookUrl, {
          msg_type: 'text',
          content: { text: `${title}\n\n${markdown}` }
        });
        triggeredAny = true;
      }

      if (!triggeredAny) {
        return { sent: false, count: activeUrgent.length, error: '未配置任何有效推送凭据（微信 / Bark / 短信）' };
      }

      return { sent: true, count: activeUrgent.length };
    } catch (err) {
      return { sent: false, count: activeUrgent.length, error: String(err) };
    }
  }
}
