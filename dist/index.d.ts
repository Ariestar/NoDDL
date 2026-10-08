type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal' | 'passed';
type SubmissionStatus = 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Compile Error' | 'Runtime Error' | 'Judging' | 'Pending' | 'Unknown';
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
    score?: number;
    maxScore?: number;
    url?: string;
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
    course?: string;
    descriptionHtml: string;
    descriptionText: string;
    testCases: TestCase[];
    deadline?: string;
    currentCode?: string;
}
interface SubmissionResult {
    id: string;
    problemId: string;
    problemTitle?: string;
    status: SubmissionStatus;
    score?: number;
    memoryKb?: number;
    timeMs?: number;
    submitTime: string;
    detailUrl?: string;
}
interface PushConfig {
    pushplusToken?: string;
    barkUrl?: string;
    customWebhookUrl?: string;
    hoursThreshold?: number;
}
interface PlatformConfig {
    baseUrl?: string;
    stid?: string;
    pwd?: string;
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

/**
 * 根据剩余小时数评估紧急等级
 */
declare function calculateUrgency(remainingHours: number): UrgencyLevel;
/**
 * 格式化剩余时间为人性化中文
 */
declare function formatRemainingTime(remainingHours: number): string;
/**
 * 解析并标准化时间字符串为时间戳和剩余小时数
 */
declare function parseDeadline(deadlineStr: string, nowMs?: number): {
    timestamp: number;
    remainingHours: number;
    remainingText: string;
};
/**
 * 生成全渠道告警通知文本 (HTML / Markdown / 纯文本)
 */
declare function formatNotificationContent(assignments: Assignment[]): {
    title: string;
    markdown: string;
    html: string;
};

interface CourseInfo {
    id: string;
    name: string;
}
/**
 * 解析 CourseGrading 课程列表
 * 来源：/courselist.jsp 或 /main.jsp 下拉菜单
 */
declare function parseCourseListHtml(html: string): CourseInfo[];
/**
 * 解析 CourseGrading 活跃作业列表
 * 来源：/assignment/mainActiveAssigns.jsp 或页面上的 .main-zy 容器
 */
declare function parseActiveAssignmentsHtml(html: string, courseName?: string, nowMs?: number): Assignment[];
/**
 * 解析 CourseGrading 作业详情页面
 * 来源：/assignment/index.jsp?assignID={id}
 */
declare function parseAssignmentIndexHtml(html: string, nowMs?: number): {
    title?: string;
    deadline?: string;
    deadlineTimestamp: number;
    remainingHours: number;
    remainingText: string;
    problems: {
        index: number;
        id: string;
        title: string;
        score?: number;
    }[];
};
/**
 * 解析题目输入输出样例
 * 来源：/assignment/programList.jsp 或 /acm/submit.jsp
 */
declare function parseProblemTestCases(html: string): TestCase[];
/**
 * 解析题目详情与代码
 * 来源：/assignment/programList.jsp
 */
declare function parseProblemDetailHtml(problemId: string, html: string): ProblemDetail;
/**
 * 解析评测结果状态表
 * 来源：/acm/problemset_stat.jsp
 */
declare function parseSubmissionResultHtml(html: string): SubmissionResult[];

/**
 * 原生 Fetch HTTP 适配器（Node 18+ 或 浏览器均可使用）
 */
declare class FetchHttpClient implements HttpClient {
    private defaultHeaders;
    constructor(defaultHeaders?: Record<string, string>);
    get(url: string, headers?: Record<string, string>): Promise<string>;
    post(url: string, data?: unknown, headers?: Record<string, string>): Promise<string>;
}

declare class CourseGradingClient {
    private baseUrl;
    private http;
    private sessionCookie;
    constructor(config?: PlatformConfig, http?: HttpClient);
    setSessionCookie(cookie: string): void;
    getSessionCookie(): string;
    private getAuthHeaders;
    /**
     * 登录一体化平台（自动加密密码）
     */
    login(stid: string, plainPwd: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 获取当前学生加入的所有课程列表
     * 接口: GET /courselist.jsp 或 /main.jsp
     */
    getCourses(): Promise<CourseInfo[]>;
    /**
     * 切换当前激活课程上下文
     * 接口: GET /courselist.jsp?courseID={id}
     */
    enterCourse(courseId: string): Promise<void>;
    /**
     * 查询所有课程中当前未完成的作业与实训
     * 接口: GET /assignment/mainActiveAssigns.jsp 及 /assignment/index.jsp
     */
    getPendingAssignments(hoursThreshold?: number): Promise<Assignment[]>;
    /**
     * 获取题目详情与测试用例
     * 接口: GET /assignment/programList.jsp?proNum={proNum}&assignID={assignId}
     */
    getProblemDetail(assignId: string, proNum?: number): Promise<ProblemDetail>;
    /**
     * 查询最新评测结果
     * 接口: GET /acm/problemset_stat.jsp
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

export { type Assignment, COURSE_GRADING_SECRET_KEY, CourseGradingClient, type CourseInfo, FetchHttpClient, type HttpClient, type PlatformConfig, type ProblemDetail, type PushConfig, type StorageAdapter, type SubmissionResult, type SubmissionStatus, type TestCase, type UrgencyLevel, calculateUrgency, decryptPassword, encryptPassword, formatNotificationContent, formatRemainingTime, parseActiveAssignmentsHtml, parseAssignmentIndexHtml, parseCourseListHtml, parseDeadline, parseProblemDetailHtml, parseProblemTestCases, parseSubmissionResultHtml };
