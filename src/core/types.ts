export type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal' | 'passed';

export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Compile Error'
  | 'Runtime Error'
  | 'Judging'
  | 'Pending'
  | 'Unknown';

export interface Assignment {
  id: string;
  courseName: string;
  title: string;
  deadline: string;            // 格式化时间字符串，例如 "2026-10-10 23:59:00"
  deadlineTimestamp: number;   // 毫秒时间戳
  remainingHours: number;      // 剩余小时数 (可为负数表示已逾期)
  remainingText: string;       // 例如 "剩余 12 小时 30 分"
  status: 'pending' | 'submitted' | 'graded';
  urgency: UrgencyLevel;
  score?: number;
  maxScore?: number;
  url?: string;
}

export interface TestCase {
  index: number;
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemDetail {
  id: string;
  title: string;
  course?: string;
  descriptionHtml: string;
  descriptionText: string;
  testCases: TestCase[];
  deadline?: string;
  currentCode?: string;
}

export interface SubmissionResult {
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

export interface PushConfig {
  pushplusToken?: string;
  barkUrl?: string;
  customWebhookUrl?: string;
  hoursThreshold?: number;     // 低于此小时数触发提醒，默认 48
}

export interface PlatformConfig {
  baseUrl?: string;            // 默认 http://115.156.107.145
  stid?: string;               // 学号
  pwd?: string;                // 明文密码
  sessionCookie?: string;      // 现有登录 Cookie
  push?: PushConfig;
}

export interface HttpClient {
  get(url: string, headers?: Record<string, string>): Promise<string>;
  post(url: string, data?: unknown, headers?: Record<string, string>): Promise<string>;
}

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
