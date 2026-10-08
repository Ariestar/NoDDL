type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal' | 'passed';
type SubmissionStatus = 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Compile Error' | 'Runtime Error' | 'Judging' | 'Pending' | 'Unknown';
interface Course {
    id: string;
    name: string;
}
interface Assignment {
    id: string;
    courseName: string;
    title: string;
    deadline: string;
    deadlineTimestamp: number;
    remainingHours: number;
    remainingText: string;
    status: 'pending' | 'submitted' | 'graded';
    urgency: UrgencyLevel;
    url: string;
}
interface TestCase {
    index: number;
    input: string;
    output: string;
    explanation?: string;
}
interface ProblemDetail {
    id: string;
    title: string;
    descriptionHtml: string;
    descriptionText: string;
    testCases: TestCase[];
    currentCode?: string;
}
interface SubmissionResult {
    id: string;
    problemId: string;
    problemTitle: string;
    status: SubmissionStatus;
    submitTime: string;
}
interface PushConfig {
    pushplusToken?: string;
    barkUrl?: string;
    customWebhookUrl?: string;
    hoursThreshold?: number;
}
interface PlatformConfig {
    baseUrl?: string;
    sessionCookie?: string;
    push?: PushConfig;
}
interface HttpClient {
    get(url: string, headers?: Record<string, string>): Promise<string>;
    post(url: string, data?: unknown, headers?: Record<string, string>): Promise<string>;
}
interface StorageAdapter {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}

declare const COURSE_GRADING_SECRET_KEY = "Client8Sess!06ID";
/**
 * 武大一体化平台 (CourseGrading) 前端密码加密算法
 * 采用 AES-ECB 模式与 PKCS7 填充，密钥为固定 Client8Sess!06ID
 */
declare function encryptPassword(password: string, secretKey?: string): string;
/**
 * 解密函数（供测试与逆向校验）
 */
declare function decryptPassword(ciphertext: string, secretKey?: string): string;

declare class FetchHttpClient implements HttpClient {
    private defaultHeaders;
    constructor(defaultHeaders?: Record<string, string>);
    get(url: string, headers?: Record<string, string>): Promise<string>;
    post(url: string, data?: unknown, headers?: Record<string, string>): Promise<string>;
}

interface ParsedDeadline {
    raw: string;
    normalized: string;
    timestamp: number;
    remainingHours: number;
    remainingText: string;
    urgency: UrgencyLevel;
}
/**
 * 评估截止时间紧迫度等级
 */
declare function calculateUrgency(remainingHours: number): UrgencyLevel;
/**
 * 格式化剩余时间为人性化倒计时 / 逾期提示
 */
declare function formatRemainingTime(remainingHours: number): string;
/**
 * 从文本或时间范围中精确提取截止时间
 * 核心逻辑：若存在 "开始时间 至 截止时间" 或 "~"，精准提取分隔符右侧的结束时间，杜绝误识别开始时间
 */
declare function extractDeadlineFromText(text: string): string;
/**
 * 北京时间 (UTC+8) DDL 解析器
 * 1. 自动从范围或混合文本中提取真正的截止时间（忽略开始时间）
 * 2. 自动处理缺少年份（如 "10-15 23:59" 或 "10月15日 23:59"）
 * 3. 强制锚定北京时间 (UTC+8)，杜绝本机时区偏差
 */
declare function parseDeadlineBeijing(rawInput: string, nowMs?: number): ParsedDeadline;

/**
 * 解析希冀平台课程列表（仅用于只读展示，严禁后台静默切换课程上下文）
 */
declare function parseCourseListHtml(html: string): Course[];
/**
 * 解析希冀平台活跃作业列表
 * 支持结构：
 * 1. 侧边栏结构：精准切分当前作业（fas fa-clock）与历史作业（fas fa-history），只抓取当前作业
 * 2. 标准活跃容器：div.main-zy 或包含 assignID 的链接列表
 */
declare function parseActiveAssignmentsHtml(html: string, courseName?: string, nowMs?: number): Assignment[];
/**
 * 解析希冀平台作业详情页与题目列表
 * 来源：/assignment/index.jsp?assignID={id} 或 fileUploadList.jsp / programList.jsp
 */
declare function parseAssignmentDetailHtml(html: string, nowMs?: number): {
    title?: string;
    deadline?: string;
    deadlineTimestamp: number;
    remainingHours: number;
    remainingText: string;
};
/**
 * 解析题目输入输出用例
 */
declare function parseTestCases(html: string): TestCase[];
/**
 * 解析题目详情（兼容编程题 programList.jsp 与文件上传题 fileUploadList.jsp）
 */
declare function parseProblemDetailHtml(problemId: string, html: string): ProblemDetail;
/**
 * 解析评测记录表
 */
declare function parseSubmissionsHtml(html: string): SubmissionResult[];

declare class CourseGradingClient {
    private baseUrl;
    private http;
    private sessionCookie;
    constructor(config?: PlatformConfig, http?: HttpClient);
    setSessionCookie(cookie: string): void;
    getSessionCookie(): string;
    private getAuthHeaders;
    /**
     * 登录平台（自动使用固定 AES 密钥加密）
     */
    login(stid: string, plainPwd: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 获取学生加入的课程列表（只读查询）
     */
    getCourses(): Promise<Course[]>;
    /**
     * 查询当前激活课程中的活跃作业与实训
     * 【核心原则】严禁在后台静默请求 /courselist.jsp?courseID=xxx 篡改用户的会话上下文，
     * 仅只读请求当前课程作业页面，绝不影响浏览器当前课程状态。
     */
    getPendingAssignments(hoursThreshold?: number): Promise<Assignment[]>;
    /**
     * 获取题目详情与测试用例（兼容 programList.jsp 与 fileUploadList.jsp）
     */
    getProblemDetail(assignId: string, proNum?: number): Promise<ProblemDetail>;
    /**
     * 查询最新评测结果
     */
    getLatestSubmissions(): Promise<SubmissionResult[]>;
    /**
     * 触发 DDL 告警推送
     */
    triggerPushAlert(config: PushConfig): Promise<{
        sent: boolean;
        count: number;
        error?: string;
    }>;
}

export { type Assignment, COURSE_GRADING_SECRET_KEY, type Course, CourseGradingClient, FetchHttpClient, type HttpClient, type ParsedDeadline, type PlatformConfig, type ProblemDetail, type PushConfig, type StorageAdapter, type SubmissionResult, type SubmissionStatus, type TestCase, type UrgencyLevel, calculateUrgency, decryptPassword, encryptPassword, extractDeadlineFromText, formatRemainingTime, parseActiveAssignmentsHtml, parseAssignmentDetailHtml, parseCourseListHtml, parseDeadlineBeijing, parseProblemDetailHtml, parseSubmissionsHtml, parseTestCases };
