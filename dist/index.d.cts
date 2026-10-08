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
 * 评估截止时间紧急度等级
 */
declare function calculateUrgency(remainingHours: number): UrgencyLevel;
/**
 * 格式化剩余时间为人性化中文倒计时
 */
declare function formatRemainingTime(remainingHours: number): string;
/**
 * 健壮的北京时间 (UTC+8) 死线解析器
 * 1. 自动处理缺少年份（如 "10-15 23:59" 或 "10月15日 23:59"）
 * 2. 自动清洗中文字符（年月日、点分隔符、斜杠）
 * 3. 强制锚定北京时间 (UTC+8)，杜绝本机时区导致偏差 8 小时
 */
declare function parseDeadlineBeijing(rawDeadlineStr: string, nowMs?: number): ParsedDeadline;

/**
 * 解析 CourseGrading 课程列表
 * 来源：/courselist.jsp 或 /main.jsp
 */
declare function parseCourseListHtml(html: string): Course[];
/**
 * 解析 CourseGrading 活跃作业列表
 * 来源：/assignment/mainActiveAssigns.jsp 或当前页面中的 .main-zy 容器
 */
declare function parseActiveAssignmentsHtml(html: string, courseName?: string, nowMs?: number): Assignment[];
/**
 * 解析 CourseGrading 作业详情页
 * 来源：/assignment/index.jsp?assignID={id}
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
 * 来源：/assignment/programList.jsp 或 /acm/submit.jsp
 */
declare function parseTestCases(html: string): TestCase[];
/**
 * 解析题目描述与代码
 * 来源：/assignment/programList.jsp
 */
declare function parseProblemDetailHtml(problemId: string, html: string): ProblemDetail;
/**
 * 解析评测记录表
 * 来源：/acm/problemset_stat.jsp
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
     * 获取学生加入的课程列表
     */
    getCourses(): Promise<Course[]>;
    /**
     * 切换当前激活课程上下文
     */
    enterCourse(courseId: string): Promise<void>;
    /**
     * 汇聚所有课程中未完成的作业与实训
     */
    getPendingAssignments(hoursThreshold?: number): Promise<Assignment[]>;
    /**
     * 获取题目详情与测试用例
     */
    getProblemDetail(assignId: string, proNum?: number): Promise<ProblemDetail>;
    /**
     * 查询最新评测结果
     */
    getLatestSubmissions(): Promise<SubmissionResult[]>;
    /**
     * 触发死线告警推送
     */
    triggerPushAlert(config: PushConfig): Promise<{
        sent: boolean;
        count: number;
        error?: string;
    }>;
}

export { type Assignment, COURSE_GRADING_SECRET_KEY, type Course, CourseGradingClient, FetchHttpClient, type HttpClient, type ParsedDeadline, type PlatformConfig, type ProblemDetail, type PushConfig, type StorageAdapter, type SubmissionResult, type SubmissionStatus, type TestCase, type UrgencyLevel, calculateUrgency, decryptPassword, encryptPassword, formatRemainingTime, parseActiveAssignmentsHtml, parseAssignmentDetailHtml, parseCourseListHtml, parseDeadlineBeijing, parseProblemDetailHtml, parseSubmissionsHtml, parseTestCases };
