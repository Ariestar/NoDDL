type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal' | 'passed';
type SubmissionStatus = 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Compile Error' | 'Runtime Error' | 'Judging' | 'Pending' | 'Unknown';
interface Course {
    id: string;
    name: string;
}
interface Assignment {
    id: string;
    courseId?: string;
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
declare function calculateUrgency(remainingHours: number): UrgencyLevel;
declare function formatRemainingTime(remainingHours: number): string;
/**
 * 从希冀平台 HTML 或文本中提取精确截止时间
 * 希冀平台规范结构: "作业时间：<b>开始时间</b> 至 <b>截止时间</b>"
 * 无论传入整页 HTML 还是文本片段，都必须精准提取结束时间，绝对不匹配开始时间
 */
declare function extractDeadlineFromText(text: string): string;
/**
 * 健壮的北京时间 (UTC+8) DDL 解析器
 * 带严格的月 (1-12) 与日 (1-31) 边界校验，杜绝任何非日期文本误判为 00-00 导致 311 天 bug
 */
declare function parseDeadlineBeijing(rawInput: string, nowMs?: number): ParsedDeadline;

/**
 * 解析希冀平台当前激活课程信息
 * 真实结构: <span class="... dropdown-item-course font-weight-bold" value="184">离散数学</span>
 */
declare function parseActiveCourseInfo(html: string): {
    id?: string;
    name?: string;
};
/**
 * 解析希冀平台课程列表
 * 真实结构: <span class="dropdown-item dropdown-item-course..." value="184">离散数学</span>
 * 或 <a href="courselist.jsp?courseID=184">离散数学</a>
 */
declare function parseCourseListHtml(html: string): Course[];
/**
 * 解析希冀平台侧边栏中的作业列表
 * 真实结构:
 * <span class="text-muted"><strong><i class="fas fa-clock"></i> 当前作业</strong></span>
 * <div class="list-group list-group-flush mb-4">
 *     <a href="index.jsp?courseID=184&assignID=3548" class="list-group-item list-group-item-action active">第四周作业</a>
 * </div>
 * <span class="text-muted"><strong><i class="fas fa-history"></i> 历史作业</strong></span>
 * <div class="list-group list-group-flush">...</div>
 */
declare function parseActiveAssignmentsHtml(html: string, courseName?: string, defaultCourseId?: string): Assignment[];
/**
 * 解析希冀平台作业主卡片（包含作业标题、作业时间与满分）
 * 真实结构:
 * <div class="shadow-sm p-3 mb-3 bg-light rounded">
 *     <h4>第四周作业</h4>
 *     <p>作业时间：<b>2026-09-30 21:28:00</b> 至 <b>2026-10-11 23:59:00</b></p>
 * </div>
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

interface CourseRecord {
    id: string;
    name: string;
    updatedAt: number;
}
interface AssignmentRecord {
    id: string;
    courseId: string;
    courseName: string;
    title: string;
    deadline: string;
    deadlineTimestamp: number;
    remainingHours: number;
    remainingText: string;
    status: 'pending' | 'submitted' | 'graded';
    urgency: UrgencyLevel;
    url: string;
    updatedAt: number;
}
interface NormalizedStoreData {
    version: number;
    lastSync: number;
    courses: Record<string, CourseRecord>;
    assignments: Record<string, AssignmentRecord>;
}
declare class HomeworkDB {
    private storage;
    constructor(storage: StorageAdapter);
    load(): Promise<NormalizedStoreData>;
    save(data: NormalizedStoreData): Promise<void>;
    /**
     * 注册或更新课程元数据（按 courseId 唯一索引，绝无重复课程）
     */
    upsertCourse(id: string, name: string): Promise<void>;
    /**
     * 归一化插入或更新单项作业（以 assignId 为唯一主键）
     */
    upsertAssignment(item: Assignment): Promise<void>;
    /**
     * 批量归一化更新作业
     */
    batchUpsertAssignments(items: Assignment[]): Promise<void>;
    /**
     * 获取结构化数据库中全部聚合作业列表，并进行最佳实践排序
     * 排序逻辑：
     * 1. 距离 DDL 越近的进行中作业排在最前
     * 2. 已超期的作业沉底展示
     * 3. 课程名称实时关联 courses 表，保证展示统一规范
     */
    getAllAssignments(): Promise<Assignment[]>;
}

declare class CourseGradingClient {
    private baseUrl;
    private http;
    private sessionCookie;
    db?: HomeworkDB;
    constructor(config?: PlatformConfig, http?: HttpClient, storage?: StorageAdapter);
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
     * 切换当前激活课程上下文
     */
    enterCourse(courseId: string): Promise<void>;
    /**
     * 只读读取当前活跃课程的作业列表（不篡改 Session 状态）
     */
    getPendingAssignments(hoursThreshold?: number): Promise<Assignment[]>;
    /**
     * 全量安全同步所有课程的作业并持久化存入数据库
     * 【核心保障】爬取前记录当前用户所处课程 ID，依序抓取各门课后立即切回原课程，彻底杜绝串课
     */
    safeSyncAllCourses(currentCourseId?: string, onProgress?: (msg: string) => void): Promise<Assignment[]>;
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

export { type Assignment, type AssignmentRecord, COURSE_GRADING_SECRET_KEY, type Course, CourseGradingClient, type CourseRecord, FetchHttpClient, HomeworkDB, type HttpClient, type NormalizedStoreData, type ParsedDeadline, type PlatformConfig, type ProblemDetail, type PushConfig, type StorageAdapter, type SubmissionResult, type SubmissionStatus, type TestCase, type UrgencyLevel, calculateUrgency, decryptPassword, encryptPassword, extractDeadlineFromText, formatRemainingTime, parseActiveAssignmentsHtml, parseActiveCourseInfo, parseAssignmentDetailHtml, parseCourseListHtml, parseDeadlineBeijing, parseProblemDetailHtml, parseSubmissionsHtml, parseTestCases };
